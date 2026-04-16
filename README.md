<p align="center">
  <img height="400" src="https://raw.githubusercontent.com/exelord/solid-proxies/main/logo.png" alt="Solid Proxies logo" />
</p>

# Solid Proxies

Solid Proxies endows ordinary JavaScript built-ins — `Object` and `Array` — with per-property reactivity for [Solid.js](https://www.solidjs.com). Every property read subscribes the current computation to a dedicated signal, and every mutation that actually changes observable state notifies only the subscribers of the keys it touched. Consumers use the unmodified native API: `obj.name`, `arr[0]`, `Object.keys(obj)`, `"x" in obj`, `arr.push(v)`, `delete obj.k`. No proxy-aware method calls, no path strings, no schema.

## Motivation

Solid's default `createStore` is an excellent fit for most application state: it is deep, path-based, and has well-understood update semantics via `produce` / `setStore`. Its cost is that writes flow through a dedicated mutator, consumers often work with proxy paths, and the store is structurally typed as `Store<T>` rather than `T`.

Solid Proxies occupies a different niche. It asks: *what is the smallest reactive wrapper around a plain object or array that lets idiomatic JavaScript code observe changes?* The goals are:

1. **Native API fidelity.** `signaled.foo = 1`, `delete signaled.foo`, `Object.keys(signaled)`, `"foo" in signaled`, `signaled.sort()` all behave exactly as they would on the underlying object — with the sole addition that read operations subscribe and write operations notify.
2. **Granular invalidation.** A read of `obj.a` should depend only on `a`. A write to `obj.b` must not re-run a computation that observed only `a`, or only `"a" in obj`, or only `Object.getOwnPropertyDescriptor(obj, "a")`.
3. **Shallow, opt-in composition.** The wrapper is exactly one level deep. Nested reactivity is a deliberate act (wrap the child), not a surprise. This keeps identity, iteration, and structural sharing under the developer's control.
4. **Minimal surface area.** Two factories (`createObject`, `createArray`) and nothing else.

The result is a library you reach for when you want a reactive *value* — a small record, a list of primitives, an object whose shape you do not want to redesign around a store — rather than a reactive *state tree*.

## Design

### Signal-per-key, three orthogonal caches

Every wrapped container owns three `Map`-backed caches of Solid signals:

| Cache              | Keyed by                              | Notified on                                                           |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------- |
| `propertiesCache`  | property key                          | value change (what `get` returns)                                     |
| `descriptorsCache` | property key (and a shared `OBJECT_KEYS` sentinel) | descriptor shape change, or change to the set of own keys |
| `existenceCache`   | property key                          | flip of `hasOwnProperty` / `in` result                                |

Each trap writes to the minimum set of caches required by the semantics of its operation. The split exists because consumers of `"x" in obj`, of `obj.x`, and of `Object.getOwnPropertyDescriptor(obj, "x")` observe three distinct slices of the underlying state. Coalescing them into a single signal would produce spurious wake-ups — for example, a value change on `x` would cause every `"x" in obj` consumer to re-run, even though membership did not change.

Signals are created with `{ equals: false }`: the cache is a *notification channel*, not a value container. The actual value is always served directly from the proxy's target via `Reflect`; Solid's reactivity graph is used only to track subscription and invalidation.

### Why proxies, and why not just `createStore`

`createStore` wraps recursively and routes all writes through `setStore` / `produce`. That design trades two things we want to preserve:

- **Mutation syntax.** `obj.x = 1` is the native idiom. Library consumers who are handed a `SignaledObject` can mutate it without learning a new API or threading a setter through their call sites.
- **Structural identity.** A `SignaledObject` *is-a* `T`: `instanceof` on the source class succeeds, the prototype chain is preserved, and symbol-keyed properties survive the wrap. Stores present a `Store<T>` view.

The cost Solid Proxies pays is that it is shallow by design. If you want deep reactivity, wrap each level that needs to be reactive — or reach for `createStore`.

### Cloning strategy

`createObject(source)` does not proxy `source` directly. It takes a shallow clone:

```ts
const proto       = Object.getPrototypeOf(source);
const descriptors = Object.getOwnPropertyDescriptors(source);
// normalize: every descriptor becomes configurable; data descriptors become writable
const clone       = Object.create(proto, descriptors);
return new Proxy(clone, createHandler<T>());
```

Three properties fall out of this strategy:

1. **The prototype is preserved** — `signaled instanceof SourceClass` is `true`, accessors defined on the class still dispatch, and `Object.getPrototypeOf(signaled) === proto` holds. The handler defines no `getPrototypeOf` trap, so `Object.setPrototypeOf` and subsequent `Object.getPrototypeOf` behave identically to the native case.
2. **Symbol-keyed properties survive.** `Object.assign({}, source)` would silently drop them; `Object.create(proto, descriptors)` does not, because `Object.getOwnPropertyDescriptors` enumerates symbol keys.
3. **Frozen or sealed inputs are not fatal.** Every descriptor is normalized to `configurable: true` (and `writable: true` for data descriptors) on the clone. The source object is untouched; the wrapper is mutable.

The source object itself is never mutated. A program holding a reference to `source` will not observe writes made through the wrapper — an intentional isolation boundary.

### Trap semantics

The object handler implements the following traps. Each is designed around the invariant *notify iff observable state changed*.

- **`get(target, p, receiver)`** — tracks `p` in `propertiesCache`, returns `Reflect.get(target, p, receiver)`. Forwarding `receiver` is essential: it ensures that accessor getters defined on the prototype observe `this === proxy`, so any `this.x` inside a getter re-enters the proxy and subscribes correctly.
- **`has(target, p)`** — tracks `p` in `existenceCache`. Separate from properties so that `"x" in obj` consumers are not woken by mere value changes on `x`.
- **`getOwnPropertyDescriptor(target, p)`** — tracks `p` in `descriptorsCache`. Consumers that inspect attributes (enumerable, configurable, writable, get, set) are invalidated only when the descriptor genuinely differs.
- **`ownKeys(target)`** — tracks the shared `OBJECT_KEYS` symbol in `descriptorsCache`. A single sentinel key is used because the set of keys is an atomic observable; a flip on any individual key's enumerability re-invalidates the whole iteration.
- **`defineProperty(target, p, attributes)`** — the write path. Captures the previous descriptor, applies the definition, captures the next descriptor, then raises four independent notifications: enumerability flip → `OBJECT_KEYS`; existence flip → `existenceCache[p]`; any descriptor diff → `descriptorsCache[p]`; value change (or accessor identity change) → `propertiesCache[p]`. Notifications are wrapped in `batch()` so that a single write causes at most one synchronous round of effects.
- **`deleteProperty(target, p)`** — guarded by both `Reflect.has` and the boolean result of `Reflect.deleteProperty`. A silent failure on a non-configurable property must not produce notifications; a successful delete on a key whose stored value was `undefined` must.
- **`setPrototypeOf(target, v)`** — the only trap that invalidates wholesale. A prototype change can alter `has`, `get`, and the own-descriptor view for any inherited key, so all three caches are dirtied via `dirtyAll`.

There is **no explicit `set` trap**. The ECMAScript *OrdinarySetWithOwnDescriptor* algorithm guarantees that `Reflect.set(target, p, v, receiver)` — which is what the default `set` behavior reduces to — invokes `receiver.[[DefineOwnProperty]]` for data-property writes. Because the receiver is the proxy, that routes straight into our `defineProperty` trap, which already computes the correct notification set. Keeping a redundant `set` trap would merely duplicate the logic and re-invoke any accessor getter on the prior value. Its absence is a deliberate consequence of the spec.

### The array handler

The array handler composes the object handler but overrides two traps:

- **`get`** maps reads of `length`, `values`, `keys`, and `entries` to the `OBJECT_KEYS` sentinel rather than individual property keys. These accessors observe the full key set, so subscribing them to the key-set signal produces correct invalidation for every mutating array method (`push`, `pop`, `splice`, `sort`, `reverse`, assignment to an out-of-bounds index, assignment to `length`).
- **`set`** intercepts only the special case of assigning to `length`. Truncation removes keys without invoking `deleteProperty` per-index, and growth extends the array with holes. Both cases bypass the `defineProperty` path, so the trap manually dirties the affected indices in all three caches plus `OBJECT_KEYS`. All other writes fall through to the default proxy behavior, routed into `defineProperty` via OrdinarySetWithOwnDescriptor.

## Use cases

Solid Proxies is well suited to:

- **Reactive value objects.** Form state, configuration objects, DTOs, or class instances whose identity should survive the wrap and whose consumers read via dot-access.
- **Library code handed a plain object.** If your API contract is "I accept a `User` and react to its fields", a `SignaledObject<User>` preserves that contract without leaking a store abstraction into callers.
- **Integration with imperative code.** Third-party code that mutates objects it receives — for example, algorithms that call `obj.visited = true` — participates in reactivity without modification.
- **Collections of primitives or opaque references.** A `SignaledArray<string>` or `SignaledArray<Node>` gives you reactive length, reactive iteration, and reactive index access with zero setup.

It is a worse fit than `createStore` when:

- The state is a deeply nested tree and you want reactivity at every level by default.
- You want path-based batched updates (`setStore("users", 0, "name", "X")`).
- You need time-travel, middleware, or the structural-sharing guarantees that stores provide.

## Limitations

- **Shallow by design.** Wrapping is exactly one level. Nested objects or arrays must be wrapped explicitly if reactivity is required below the top level.
- **Identity boundary.** The wrapper is a proxy over a *clone* of the input. Mutations to the source object are not observed, and mutations through the wrapper are not reflected in the source.
- **No transactional batch API.** Multiple writes within a single synchronous sequence will already be batched by Solid (each trap wraps its notifications in `batch()`), but there is no wrapper-level "edit session" primitive.
- **Property descriptors are normalized.** The clone's own properties are always `configurable: true`, and data properties are `writable: true`, regardless of how the source was defined. This is the price of allowing subsequent mutation.

## Installation

```
npm install solid-proxies
```

## Compatibility

- Solid.js `^1.0`

## Demo

CodeSandbox: [solid-proxies demo](https://codesandbox.io/s/solid-proxies-pt2slm)

## API

### `createObject<T>(source: T): T`

Returns a reactive proxy over a shallow clone of `source`. The return type is structurally identical to `T`: fields, methods, and the prototype chain are preserved.

```ts
import { createEffect } from "solid-js";
import { createObject } from "solid-proxies";

const user = createObject({ name: "Maciej" });

createEffect(() => {
  console.log(user.name);
});

user.name = "Exelord"; // effect re-runs
```

Nested containers are not wrapped automatically:

```ts
const user = createObject({
  name: "Maciej",
  address: createObject({ city: "New York", country: "USA" }),
});

createEffect(() => console.log(user.address.city));

user.address.city = "London"; // effect re-runs
```

### `createArray<T>(source: T[]): T[]`

Returns a reactive proxy over a shallow clone of `source`. All standard array operations — index access, `length`, iteration protocols, and mutating methods (`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`) — are reactive.

```ts
import { createEffect } from "solid-js";
import { createArray } from "solid-proxies";

const users = createArray([{ name: "Maciej" }]);

createEffect(() => {
  console.log(users[0].name);
});

users[0] = { name: "Exelord" }; // effect re-runs
```

As with `createObject`, nested containers must be wrapped explicitly to be reactive:

```ts
const users = createArray([
  { name: "Maciej", favoriteColors: ["red", "blue"] },
]);

createEffect(() => console.log(users[0].favoriteColors[0]));

users[0].favoriteColors[0] = "green"; // effect does NOT re-run

users[0].favoriteColors = createArray(["yellow", "purple"]);
users[0].favoriteColors[0] = "green"; // effect re-runs
```
