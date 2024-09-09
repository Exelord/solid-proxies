import { createWeakCache, track, dirty } from "../utils/cache";

export class SignaledWeakSet<T extends object = object> extends WeakSet<T> {
  private readonly signalsCache = createWeakCache();

  constructor(values?: Iterable<T> | null) {
    super();
    if (values) for (const value of values) super.add(value);
  }

  has(value: T): boolean {
    track(value, this.signalsCache);
    return super.has(value);
  }

  add(value: T): this {
    if (!super.has(value)) {
      super.add(value);
      dirty(value, this.signalsCache);
    }

    return this;
  }

  delete(value: T): boolean {
    const result = super.delete(value);

    if (result) {
      dirty(value, this.signalsCache);
    }

    return result;
  }
}

export function createWeakSet<T extends object = object>(
  values?: Iterable<T> | null
): SignaledWeakSet<T> {
  return new SignaledWeakSet(values);
}
