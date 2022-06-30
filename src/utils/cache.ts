import { createSignal, Signal } from "solid-js";

type Cache = Map<unknown, Signal<any>> | WeakMap<object, Signal<any>>;

export function track(key: unknown, cache: Map<unknown, Signal<any>>): void;
export function track<T>(
  key: object,
  cache: WeakMap<object, Signal<any>>
): void;
export function track(key: any, cache: Cache): void {
  let signal = cache.get(key);

  if (signal) {
    signal[0]();
    return;
  }

  signal = createSignal(undefined, { equals: false });
  cache.set(key, signal);
  signal[0]();
}

export function dirty(key: unknown, cache: Map<unknown, Signal<any>>): void;
export function dirty(key: object, cache: WeakMap<object, Signal<any>>): void;
export function dirty(key: any, cache: Cache): void {
  const signal = cache.get(key);
  if (signal) signal[1]();
}

export function dirtyAll(cache: Map<unknown, Signal<any>>): void {
  cache.forEach((signal) => signal[1]());
}

export function createCache(): Map<unknown, Signal<any>> {
  return new Map<unknown, Signal<any>>();
}

export function createWeakCache(): WeakMap<object, Signal<any>> {
  return new WeakMap<object, Signal<any>>();
}
