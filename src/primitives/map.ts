import { createCache } from "../utls/cache";

export const OBJECT_KEYS = Symbol("objectKeys");

export class SignaledMap<K = unknown, V = unknown> implements Map<K, V> {
  private signals = createCache();

  private cache: Map<K, V>;

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
    this.cache = existing ? new Map(existing) : new Map();
  }

  get size(): number {
    this.signals.track(OBJECT_KEYS);
    return this.cache.size;
  }

  get [Symbol.toStringTag](): string {
    return this.cache[Symbol.toStringTag];
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    this.signals.track(OBJECT_KEYS);
    return this.cache[Symbol.iterator]();
  }

  get(key: K): V | undefined {
    this.signals.track(key);
    return this.cache.get(key);
  }

  has(key: K): boolean {
    this.signals.track(key);
    return this.cache.has(key);
  }

  entries(): IterableIterator<[K, V]> {
    this.signals.track(OBJECT_KEYS);
    return this.cache.entries();
  }

  keys(): IterableIterator<K> {
    this.signals.track(OBJECT_KEYS);
    return this.cache.keys();
  }

  values(): IterableIterator<V> {
    this.signals.track(OBJECT_KEYS);
    return this.cache.values();
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void): void {
    this.signals.track(OBJECT_KEYS);
    this.cache.forEach(fn);
  }

  set(key: K, value: V): this {
    const hasKey = this.cache.has(key);
    const prevValue = this.cache.get(key);

    this.cache.set(key, value);

    if (!hasKey || value !== prevValue) this.signals.dirty(OBJECT_KEYS);
    if (value !== prevValue) this.signals.dirty(key);

    return this;
  }

  delete(key: K): boolean {
    if (!this.cache.has(key)) return false;

    const currentValue = this.cache.get(key);
    const result = this.cache.delete(key);

    this.signals.dirty(OBJECT_KEYS);

    if (currentValue !== undefined) this.signals.dirty(key);

    return result;
  }

  clear(): void {
    this.signals.dirtyAll();
    this.signals.dirty(OBJECT_KEYS);

    this.cache.clear();
  }
}

Object.setPrototypeOf(SignaledMap.prototype, Map.prototype);

export function createMap<K = unknown, V = unknown>(map: Map<K, V>): Map<K, V> {
  return new SignaledMap<K, V>(map);
}
