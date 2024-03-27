import { batch } from "solid-js";
import { createWeakCache, track, dirty } from "../utils/cache";

export class SignaledWeakMap<K extends object, V> extends WeakMap<K, V> {
  private readonly keysCache = createWeakCache();
  private readonly valuesCache = createWeakCache();

  constructor(entries?: readonly [K, V][] | null) {
    super();
    if (entries) for (const entry of entries) super.set(...entry);
  }

  get(key: K): V | undefined {
    track(key, this.valuesCache);
    return super.get(key);
  }

  has(key: K): boolean {
    track(key, this.keysCache);
    return super.has(key);
  }

  set(key: K, value: V): this {
    const hasKey = super.has(key);
    const currentValue = super.get(key);
    const result = super.set(key, value);

    batch(() => {
      if (!hasKey) dirty(key, this.keysCache);
      if (value !== currentValue) dirty(key, this.valuesCache);
    });

    return result;
  }

  delete(key: K): boolean {
    const currentValue = super.get(key);
    const result = super.delete(key);

    if (result) {
      batch(() => {
        dirty(key, this.keysCache);
        if (currentValue !== undefined) dirty(key, this.valuesCache);
      });
    }

    return result;
  }
}

export function createWeakMap<K extends object = object, V = any>(
  entries?: readonly [K, V][] | null
): WeakMap<K, V> {
  return new SignaledWeakMap(entries);
}
