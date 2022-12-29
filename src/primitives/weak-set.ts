import { createWeakCache, track, dirty } from "../utils/cache";

class SignaledWeakSet<T extends object = object> implements WeakSet<T> {
  private readonly signalsCache = createWeakCache();
  private readonly valuesCache: WeakSet<T>;

  constructor(values?: readonly T[] | null) {
    this.valuesCache = new WeakSet(values);
  }

  get [Symbol.toStringTag](): string {
    return this.valuesCache[Symbol.toStringTag];
  }

  has(value: T): boolean {
    track(value, this.signalsCache);
    return this.valuesCache.has(value);
  }

  add(value: T): this {
    if (!this.valuesCache.has(value)) {
      this.valuesCache.add(value);
      dirty(value, this.signalsCache);
    }

    return this;
  }

  delete(value: T): boolean {
    const result = this.valuesCache.delete(value);

    if (result) {
      dirty(value, this.signalsCache);
    }

    return result;
  }
}

// So instanceof works
Object.setPrototypeOf(SignaledWeakSet.prototype, WeakSet.prototype);

export function createWeakSet<T extends object = object>(
  values?: readonly T[] | null
): WeakSet<T> {
  return new SignaledWeakSet(values);
}
