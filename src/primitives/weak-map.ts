import { createWeakCache, track, dirty } from "../utils/cache";

class SignaledWeakMap<K extends object = object, V = unknown>
  implements WeakMap<K, V>
{
  private readonly signalsCache = createWeakCache();

  private readonly valuesCache: WeakMap<K, V>;

  constructor();
  constructor(iterable?: Iterable<readonly [K, V]>);
  constructor(entries?: readonly [K, V][] | null);
  constructor(
    existing?: readonly [K, V][] | Iterable<readonly [K, V]> | null | undefined
  ) {
    // TypeScript doesn't correctly resolve the overloads for calling the `Map`
    // constructor for the no-value constructor. This resolves that.
    this.valuesCache = existing ? new WeakMap(existing) : new WeakMap();
  }

  get [Symbol.toStringTag](): string {
    return this.valuesCache[Symbol.toStringTag];
  }

  get(key: K): V | undefined {
    track(key, this.signalsCache);
    return this.valuesCache.get(key);
  }

  has(key: K): boolean {
    track(key, this.signalsCache);
    return this.valuesCache.has(key);
  }

  set(key: K, value: V): this {
    const prevValue = this.valuesCache.get(key);

    this.valuesCache.set(key, value);

    if (value !== prevValue) dirty(key, this.signalsCache);

    return this;
  }

  delete(key: K): boolean {
    if (!this.valuesCache.has(key)) return false;

    const currentValue = this.valuesCache.get(key);
    const result = this.valuesCache.delete(key);

    if (currentValue !== undefined) dirty(key, this.signalsCache);

    return result;
  }
}

Object.setPrototypeOf(SignaledWeakMap.prototype, WeakMap.prototype);

export function createWeakMap(): WeakMap<object, any>;
export function createWeakMap<K extends object = object, V = unknown>(
  entries?: readonly (readonly [K, V])[] | null
): WeakMap<K, V>;
export function createWeakMap<K extends object = object, V = unknown>(
  iterable?: Iterable<readonly [K, V]>
): WeakMap<K, V>;
export function createWeakMap<K extends object = object, V = unknown>(
  existing?:
    | readonly (readonly [K, V])[]
    | Iterable<readonly [K, V]>
    | null
    | undefined
): WeakMap<K, V> {
  return existing
    ? new SignaledWeakMap<K, V>(existing)
    : new SignaledWeakMap<K, V>();
}
