import { createCache, track, dirty, dirtyAll } from "../utils/cache";

const OBJECT_KEYS = Symbol("objectKeys");

export class SignaledSet<T> extends Set<T> {
  private readonly signalsCache = createCache();

  constructor(values?: readonly T[] | null) {
    super();
    if (values) for (const v of values) super.add(v);
  }

  get size(): number {
    track(OBJECT_KEYS, this.signalsCache);
    return super.size;
  }

  [Symbol.iterator](): IterableIterator<T> {
    track(OBJECT_KEYS, this.signalsCache);
    return super[Symbol.iterator]();
  }

  entries(): IterableIterator<[T, T]> {
    track(OBJECT_KEYS, this.signalsCache);
    return super.entries();
  }

  keys(): IterableIterator<T> {
    track(OBJECT_KEYS, this.signalsCache);
    return super.keys();
  }

  values(): IterableIterator<T> {
    track(OBJECT_KEYS, this.signalsCache);
    return super.values();
  }

  forEach(fn: (value1: T, value2: T, set: Set<T>) => void): void {
    track(OBJECT_KEYS, this.signalsCache);
    super.forEach(fn);
  }

  has(value: T): boolean {
    track(value, this.signalsCache);
    return super.has(value);
  }

  add(value: T): this {
    if (!super.has(value)) {
      super.add(value);
      dirty(value, this.signalsCache);
      dirty(OBJECT_KEYS, this.signalsCache);
    }

    return this;
  }

  delete(value: T): boolean {
    const result = super.delete(value);

    if (result) {
      dirty(value, this.signalsCache);
      dirty(OBJECT_KEYS, this.signalsCache);
    }

    return result;
  }

  clear(): void {
    if (super.size) {
      super.clear();
      dirtyAll(this.signalsCache);
      dirty(OBJECT_KEYS, this.signalsCache);
    }
  }
}

export function createSet<T>(values?: readonly T[] | null): SignaledSet<T> {
  return new SignaledSet<T>(values);
}