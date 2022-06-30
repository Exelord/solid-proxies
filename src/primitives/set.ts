import { createCache, track, dirty, dirtyAll } from "../utils/cache";

const OBJECT_KEYS = Symbol("objectKeys");

class SignaledSet<T = unknown> implements Set<T> {
  private readonly signalsCache = createCache();
  private readonly valuesCache: Set<T>;

  constructor();
  constructor(values: readonly T[] | null);
  constructor(iterable: Iterable<T>);
  constructor(existing?: readonly T[] | Iterable<T> | null | undefined) {
    this.valuesCache = new Set(existing);
  }

  get size(): number {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.size;
  }

  [Symbol.iterator](): IterableIterator<T> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache[Symbol.iterator]();
  }

  get [Symbol.toStringTag](): string {
    return this.valuesCache[Symbol.toStringTag];
  }

  entries(): IterableIterator<[T, T]> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.entries();
  }

  keys(): IterableIterator<T> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.keys();
  }

  values(): IterableIterator<T> {
    track(OBJECT_KEYS, this.signalsCache);
    return this.valuesCache.values();
  }

  forEach(fn: (value1: T, value2: T, set: Set<T>) => void): void {
    track(OBJECT_KEYS, this.signalsCache);

    this.valuesCache.forEach(fn);
  }

  has(value: T): boolean {
    track(value, this.signalsCache);
    return this.valuesCache.has(value);
  }

  add(value: T): this {
    if (!this.valuesCache.has(value)) {
      this.valuesCache.add(value);
      dirty(value, this.signalsCache);
      dirty(OBJECT_KEYS, this.signalsCache);
    }

    return this;
  }

  delete(value: T): boolean {
    const result = this.valuesCache.delete(value);

    if (result) {
      dirty(value, this.signalsCache);
      dirty(OBJECT_KEYS, this.signalsCache);
    }

    return result;
  }

  clear(): void {
    this.valuesCache.clear();
    dirtyAll(this.signalsCache);
    dirty(OBJECT_KEYS, this.signalsCache);
  }
}

// So instanceof works
Object.setPrototypeOf(SignaledSet.prototype, Set.prototype);

export function createSet<T>(): Set<T>;
export function createSet<T>(values: readonly T[] | null): Set<T>;
export function createSet<T>(iterable: Iterable<T>): Set<T>;
export function createSet<T>(
  existing?: readonly T[] | Iterable<T> | null
): Set<T> {
  return existing ? new SignaledSet<T>(existing) : new SignaledSet<T>();
}
