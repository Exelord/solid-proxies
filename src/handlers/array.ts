import { batch } from "solid-js";
import { createCache, dirty, track } from "../utils/cache";
import {
  createHandler as createObjectHandler,
  ObjectProxyHandler,
  OBJECT_KEYS,
} from "./object";

export interface ArrayProxyHandler<T extends object>
  extends ObjectProxyHandler<T> {}

const arrayProps: Array<string | symbol> = [
  "length",
  "values",
  "keys",
  "entries",
];

export function createHandler<T extends object>(): ArrayProxyHandler<T> {
  const propertiesCache = createCache();
  const descriptorsCache = createCache();
  const existenceCache = createCache();
  const objectHandler = createObjectHandler<T>(
    propertiesCache,
    descriptorsCache,
    existenceCache
  );

  const handler: ArrayProxyHandler<T> = {
    ...objectHandler,

    get(target, p, receiver) {
      if (arrayProps.includes(p)) {
        track(OBJECT_KEYS, descriptorsCache);
      } else {
        track(p, propertiesCache);
      }

      return Reflect.get(target, p, receiver);
    },

    set(target, p, value, receiver) {
      if (p === "length") {
        const prevLength = (target as unknown as unknown[]).length;
        const result = Reflect.set(target, p, value, receiver);
        const nextLength = (target as unknown as unknown[]).length;

        if (nextLength !== prevLength) {
          batch(() => {
            dirty(OBJECT_KEYS, descriptorsCache);
            for (
              let i = Math.min(prevLength, nextLength);
              i < Math.max(prevLength, nextLength);
              i++
            ) {
              dirty(String(i), propertiesCache);
              dirty(String(i), descriptorsCache);
              dirty(String(i), existenceCache);
            }
          });
        }

        return result;
      }

      return objectHandler.set(target, p, value, receiver);
    },
  };

  return handler;
}
