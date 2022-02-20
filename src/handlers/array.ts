import { createCache } from "../utls/cache";
import {
  createHandler as createObjectHandler,
  ObjectProxyHandler,
  OBJECT_KEYS,
} from "./object";

export interface ArrayProxyHandler<T> extends ObjectProxyHandler<T> {}

const arrayProps: Array<string | Symbol> = [
  "length",
  "values",
  "keys",
  "entries",
];

export function createHandler<T extends Object>(): ArrayProxyHandler<T> {
  const propertiesCache = createCache();
  const descriptorsCache = createCache();
  const objectHandler = createObjectHandler(propertiesCache, descriptorsCache);

  const handler: ArrayProxyHandler<T> = {
    ...objectHandler,

    get(target, p) {
      if (arrayProps.includes(p)) {
        descriptorsCache.track(OBJECT_KEYS);
      } else {
        propertiesCache.track(p);
      }

      return Reflect.get(target, p);
    },
  };

  return handler;
}
