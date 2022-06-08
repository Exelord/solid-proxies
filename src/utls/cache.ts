import { Accessor, createSignal, Setter } from "solid-js";

export class SignaledCache {
  private readonly cache = new Map<
    unknown,
    [state: Accessor<any>, setState: Setter<any>]
  >();

  dirtyAll(): void {
    this.cache.forEach((signal) => signal[1]());
  }

  dirty(key: unknown): void {
    const signal = this.cache.get(key);
    if (signal) signal[1]();
  }

  track(key: unknown): void {
    let signal = this.cache.get(key);

    if (signal) {
      signal[0]();
      return;
    }

    signal = createSignal(undefined, { equals: false });
    this.cache.set(key, signal);
    signal[0]();
  }
}

export function createCache(): SignaledCache {
  return new SignaledCache();
}
