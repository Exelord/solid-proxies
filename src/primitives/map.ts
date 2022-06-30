import { createCache, track, dirty, dirtyAll } from "../utils/cache";

const OBJECT_KEYS = Symbol("objectKeys");

class SignaledMap<K = unknown, V = unknown> implements Map<K, V> {
  private readonly signalsCache = createCache();
  private readonly valuesCache: Map<K, V>;

  constructor();
  constructor(entries?: readonly (readonly [K, V])[] | null);
  constructor(iterable?: Iterable<readonly [K, V]>);
  constructor(
    existing?:
      | readonly (readonly [K, V])[]
      | Iterable<readonly [K, V]>
      | null
      | undefined
  ) {
    // TypeScript doesn't correctly resolve the overloads for calling the `Map`
    // constructor for the no-value constructor. This resolves that.
    this.valuesCache = existing ? new Map(existing) : new Map();
  }

  get size(): number {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.size;
  }

  get [Symbol.toStringTag](): string {
    return this.valuesCache[Symbol.toStringTag];
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache[Symbol.iterator]();
  }

  get(key: K): V | undefined {
    track(key, this.signalsCache);
    return this.valuesCache.get(key);
  }

  has(key: K): boolean {
    track(key, this.signalsCache);
    return this.valuesCache.has(key);
  }

  entries(): IterableIterator<[K, V]> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.entries();
  }

  keys(): IterableIterator<K> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.keys();
  }

  values(): IterableIterator<V> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.values();
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void): void {
    track(OBJECT_KEYS, this.signalsCache);
    this.valuesCache.forEach(fn);
  }

  set(key: K, value: V): this {
    const hasKey = this.valuesCache.has(key);
    const prevValue = this.valuesCache.get(key);

    this.valuesCache.set(key, value);

    if (value !== prevValue) {
      if (!hasKey) dirty(OBJECT_KEYS, this.signalsCache);
      dirty(key, this.signalsCache);
    }

    return this;
  }

  delete(key: K): boolean {
    const currentValue = this.valuesCache.get(key);
    const result = this.valuesCache.delete(key);

    if (result) {
      dirty(OBJECT_KEYS, this.signalsCache);
      if (currentValue !== undefined) dirty(key, this.signalsCache);
    }

    return result;
  }

  clear(): void {
    this.valuesCache.clear();
    dirtyAll(this.signalsCache);
    dirty(OBJECT_KEYS, this.signalsCache);
  }
}

Object.setPrototypeOf(SignaledMap.prototype, Map.prototype);

export function createMap(): Map<any, any>;
export function createMap<K = unknown, V = unknown>(
  entries?: readonly (readonly [K, V])[] | null
): Map<K, V>;
export function createMap<K = unknown, V = unknown>(
  iterable?: Iterable<readonly [K, V]>
): Map<K, V>;
export function createMap<K = unknown, V = unknown>(
  existing?:
    | readonly (readonly [K, V])[]
    | Iterable<readonly [K, V]>
    | null
    | undefined
): Map<K, V> {
  return existing
    ? new SignaledMap<K, V>(existing)
    : new SignaledMap<any, any>();
}
