import { createCache, track, dirty, dirtyAll } from "../utils/cache";

const OBJECT_KEYS = Symbol("objectKeys");

export class SignaledMap<K, V> extends Map<K, V> {
  private readonly keysCache = createCache();
  private readonly valuesCache = createCache();

  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super();
    if (entries) for (const entry of entries) super.set(...entry);
  }

  get size(): number {
    track(OBJECT_KEYS, this.keysCache);
    return super.size;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    track(OBJECT_KEYS, this.keysCache);
    return super[Symbol.iterator]();
  }

  get(key: K): V | undefined {
    track(key, this.valuesCache);
    return super.get(key);
  }

  has(key: K): boolean {
    track(key, this.keysCache);
    return super.has(key);
  }

  entries(): IterableIterator<[K, V]> {
    track(OBJECT_KEYS, this.keysCache);
    return super.entries();
  }

  keys(): IterableIterator<K> {
    track(OBJECT_KEYS, this.keysCache);
    return super.keys();
  }

  values(): IterableIterator<V> {
    track(OBJECT_KEYS, this.keysCache);
    return super.values();
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void): void {
    track(OBJECT_KEYS, this.keysCache);
    super.forEach(fn);
  }

  set(key: K, value: V): this {
    const hasKey = super.has(key);
    const currentValue = super.get(key);
    const result = super.set(key, value);

    if (!hasKey) {
      dirty(OBJECT_KEYS, this.keysCache);
      dirty(key, this.keysCache);
    }

    if (value !== currentValue) dirty(key, this.valuesCache);

    return result;
  }

  delete(key: K): boolean {
    const currentValue = super.get(key);
    const result = super.delete(key);

    if (result) {
      dirty(OBJECT_KEYS, this.keysCache);
      dirty(key, this.keysCache);
    }
    
    if (currentValue !== undefined) dirty(key, this.valuesCache);

    return result;
  }

  clear(): void {
    if (super.size) {
      super.clear();
      dirtyAll(this.valuesCache);
      dirty(OBJECT_KEYS, this.keysCache);
    }
  }
}

export function createMap<K, V>(
  entries?: readonly (readonly [K, V])[] | null
): SignaledMap<K, V> {
  return new SignaledMap(entries);
}
