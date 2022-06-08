import { createCache } from "../utls/cache";

export const OBJECT_KEYS = Symbol("objectKeys");

export class SignaledMap<K = unknown, V = unknown> implements Map<K, V> {
  private readonly signalsCache = createCache();
  private readonly valuesCache: Map<K, V>;

  constructor();
  constructor(entries: readonly (readonly [K, V])[] | null);
  constructor(iterable: Iterable<readonly [K, V]>);
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
    this.signalsCache.track(OBJECT_KEYS);
    return this.valuesCache.size;
  }

  get [Symbol.toStringTag](): string {
    return this.valuesCache[Symbol.toStringTag];
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    this.signalsCache.track(OBJECT_KEYS);
    return this.valuesCache[Symbol.iterator]();
  }

  get(key: K): V | undefined {
    this.signalsCache.track(key);
    return this.valuesCache.get(key);
  }

  has(key: K): boolean {
    this.signalsCache.track(key);
    return this.valuesCache.has(key);
  }

  entries(): IterableIterator<[K, V]> {
    this.signalsCache.track(OBJECT_KEYS);
    return this.valuesCache.entries();
  }

  keys(): IterableIterator<K> {
    this.signalsCache.track(OBJECT_KEYS);
    return this.valuesCache.keys();
  }

  values(): IterableIterator<V> {
    this.signalsCache.track(OBJECT_KEYS);
    return this.valuesCache.values();
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void): void {
    this.signalsCache.track(OBJECT_KEYS);
    this.valuesCache.forEach(fn);
  }

  set(key: K, value: V): this {
    const hasKey = this.valuesCache.has(key);
    const prevValue = this.valuesCache.get(key);

    this.valuesCache.set(key, value);

    if (!hasKey || value !== prevValue) this.signalsCache.dirty(OBJECT_KEYS);
    if (value !== prevValue) this.signalsCache.dirty(key);

    return this;
  }

  delete(key: K): boolean {
    if (!this.valuesCache.has(key)) return false;

    const currentValue = this.valuesCache.get(key);
    const result = this.valuesCache.delete(key);

    this.signalsCache.dirty(OBJECT_KEYS);

    if (currentValue !== undefined) this.signalsCache.dirty(key);

    return result;
  }

  clear(): void {
    this.signalsCache.dirtyAll();
    this.signalsCache.dirty(OBJECT_KEYS);

    this.valuesCache.clear();
  }
}

Object.setPrototypeOf(SignaledMap.prototype, Map.prototype);

export function createMap<K = unknown, V = unknown>(
  map?: Map<K, V>
): Map<K, V> {
  return map ? new SignaledMap<K, V>(map) : new SignaledMap<K, V>();
}
