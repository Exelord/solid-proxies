import { createSignal, Signal } from "solid-js";

type Cache = Map<unknown, Signal<any>>;

export function track(key: unknown, cache: Cache): void {
  let signal = cache.get(key);

  if (!signal) {
    signal = createSignal(undefined, { equals: false });
    cache.set(key, signal);
  }

  signal[0]();
}

export function dirty(key: unknown, cache: Cache): void {
  const signal = cache.get(key);
  if (signal) signal[1]();
}

export function dirtyAll(cache: Cache): void {
  cache.forEach((signal) => signal[1]());
}

export function createCache(): Cache {
  return new Map();
}
