import { batch } from "solid-js";
import { createCache, track, dirty, dirtyAll } from "../utils/cache";

const OBJECT_KEYS = Symbol("objectKeys");

export class SignaledSet<T> extends Set<T> {
  private readonly valuesCache = createCache();

  constructor(values?: readonly T[] | null) {
    super();
    if (values) for (const v of values) super.add(v);
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }

  get size(): number {
    track(OBJECT_KEYS, this.valuesCache);
    return super.size;
  }

  keys(): IterableIterator<T> {
    return this.values();
  }

  *values(): IterableIterator<T> {
    for (const key of super.values()) {
      track(key, this.valuesCache);
      yield key;
    }
    track(OBJECT_KEYS, this.valuesCache);
  }

  *entries(): IterableIterator<[T, T]> {
    for (const [key, value] of super.entries()) {
      track(key, this.valuesCache);
      yield [key, value];
    }
    track(OBJECT_KEYS, this.valuesCache);
  }

  forEach(fn: (value1: T, value2: T, set: Set<T>) => void): void {
    track(OBJECT_KEYS, this.valuesCache);
    super.forEach(fn);
  }

  has(value: T): boolean {
    track(value, this.valuesCache);
    return super.has(value);
  }

  add(value: T): this {
    if (!super.has(value)) {
      super.add(value);
      batch(() => {
        dirty(value, this.valuesCache);
        dirty(OBJECT_KEYS, this.valuesCache);
      });
    }

    return this;
  }

  delete(value: T): boolean {
    const result = super.delete(value);

    if (result) {
      batch(() => {
        dirty(value, this.valuesCache);
        dirty(OBJECT_KEYS, this.valuesCache);
      });
    }

    return result;
  }

  clear(): void {
    if (super.size) {
      super.clear();
      batch(() => {
        dirtyAll(this.valuesCache);
      });
    }
  }
}

export function createSet<T>(values?: readonly T[] | null): SignaledSet<T> {
  return new SignaledSet<T>(values);
}
