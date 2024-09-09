import { batch } from "solid-js";
import { createCache, track, dirty, dirtyAll } from "../utils/cache";

const OBJECT_KEYS = Symbol("objectKeys");

export class SignaledSet<T> extends Set<T> {
  private readonly valuesCache = createCache();

  constructor(values?: Iterable<T> | null) {
    super();
    if (values) for (const value of values) super.add(value);
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
    track(OBJECT_KEYS, this.valuesCache);

    for (const value of super.values()) {
      yield value;
    }
  }

  *entries(): IterableIterator<[T, T]> {
    track(OBJECT_KEYS, this.valuesCache);

    for (const entry of super.entries()) {
      yield entry;
    }
  }

  forEach(
    callbackfn: (value1: T, value2: T, set: Set<T>) => void,
    thisArg?: any
  ): void {
    track(OBJECT_KEYS, this.valuesCache);
    super.forEach(callbackfn, thisArg);
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

export function createSet<T>(values?: Iterable<T> | null): SignaledSet<T> {
  return new SignaledSet<T>(values);
}
