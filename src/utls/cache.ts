import { Accessor, createSignal, Setter } from "solid-js";

export interface SignaledCache {
  track(key: PropertyKey): void;
  dirty(key: PropertyKey): void;
}

export function createCache(): SignaledCache {
  const cache = new Map<
    PropertyKey,
    [state: Accessor<any>, setState: Setter<any>]
  >();

  return Object.freeze({
    dirty(key: PropertyKey): void {
      const signal = cache.get(key);
      if (signal) signal[1]();
    },

    track(key: PropertyKey): void {
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
