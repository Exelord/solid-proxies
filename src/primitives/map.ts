import { batch } from "solid-js";
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
    return this.entries();
  }

  *keys(): IterableIterator<K> {
    for (const key of super.keys()) {
      track(key, this.keysCache);
      yield key;
    }
    track(OBJECT_KEYS, this.keysCache);
  }
  *values(): IterableIterator<V> {
    for (const [key, v] of super.entries()) {
      track(key, this.valuesCache);
      yield v;
    }
    track(OBJECT_KEYS, this.keysCache);
  }
  *entries(): IterableIterator<[K, V]> {
    for (const entry of super.entries()) {
      track(entry[0], this.keysCache);
      track(entry[0], this.valuesCache);
      yield entry;
    }
    track(OBJECT_KEYS, this.keysCache);
  }

  forEach(fn: (value: V, key: K, map: Map<K, V>) => void): void {
    track(OBJECT_KEYS, this.keysCache);
    for (const [key, value] of super.entries()) {
      track(key, this.keysCache);
      track(key, this.valuesCache);
      fn(value, key, this);
    }
  }

  has(key: K): boolean {
    track(key, this.keysCache);
    return super.has(key);
  }

  get(key: K): V | undefined {
    return super.get(key);
  }

  set(key: K, value: V): this {
    const hasKey = super.has(key);
    const currentValue = super.get(key);
    const result = super.set(key, value);

    batch(() => {
      if (!hasKey) {
        dirty(OBJECT_KEYS, this.keysCache);
        dirty(key, this.keysCache);
      }

      if (value !== currentValue) dirty(key, this.valuesCache);
    });

    return result;
  }

  delete(key: K): boolean {
    const currentValue = super.get(key);
    const result = super.delete(key);

    if (result) {
      batch(() => {
        dirty(OBJECT_KEYS, this.keysCache);
        dirty(key, this.keysCache);
        if (currentValue !== undefined) dirty(key, this.valuesCache);
      });
    }

    return result;
  }

  clear(): void {
    if (super.size) {
      super.clear();
      batch(() => {
        dirtyAll(this.keysCache);
        dirtyAll(this.valuesCache);
        dirty(OBJECT_KEYS, this.keysCache);
      });
    }
  }
}

export function createMap<K, V>(
  entries?: readonly (readonly [K, V])[] | null
): SignaledMap<K, V> {
  return new SignaledMap(entries);
}
