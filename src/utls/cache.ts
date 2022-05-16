import { Accessor, createSignal, Setter } from "solid-js";

export interface SignaledCache {
  track(key: unknown): void;
  dirty(key: unknown): void;
  dirtyAll(): void;
}

export function createCache(): SignaledCache {
  const cache = new Map<
    unknown,
    [state: Accessor<any>, setState: Setter<any>]
  >();

  return Object.freeze({
    dirtyAll(): void {
      cache.forEach((signal) => signal[1]());
    },

    dirty(key: unknown): void {
      const signal = cache.get(key);
      if (signal) signal[1]();
    },

    track(key: unknown): void {
      let signal = cache.get(key);

      if (signal) {
        signal[0]();
        return;
      }

      signal = createSignal(undefined, { equals: false });
      cache.set(key, signal);
      signal[0]();
    },
  });
}
