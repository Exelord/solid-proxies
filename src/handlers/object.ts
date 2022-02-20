import { createCache } from "../utls/cache";

export const OBJECT_KEYS = Symbol("objectKeys");

export interface ObjectProxyHandler<T extends Object> extends ProxyHandler<T> {
  defineProperty(
    target: T,
    p: string | symbol,
    attributes: PropertyDescriptor
  ): boolean;
  deleteProperty(target: T, p: string | symbol): boolean;
  get(target: T, p: string | symbol, receiver: any): any;
  getOwnPropertyDescriptor(
    target: T,
    p: string | symbol
  ): PropertyDescriptor | undefined;
  has(target: T, p: string | symbol): boolean;
  ownKeys(target: T): ArrayLike<string | symbol>;
  set(target: T, p: string | symbol, value: any, receiver: any): boolean;
}

export function createHandler<T extends Object>(
  propertiesCache = createCache(),
  descriptorsCache = createCache()
): ObjectProxyHandler<T> {
  const handler: ObjectProxyHandler<T> = {
    get(target, p) {
      propertiesCache.track(p);
      return Reflect.get(target, p);
    },

    has(target, p) {
      descriptorsCache.track(p);
      return Reflect.has(target, p);
    },

    getOwnPropertyDescriptor(target: T, p: string | symbol) {
      descriptorsCache.track(p);
      return Reflect.getOwnPropertyDescriptor(target, p);
    },

    ownKeys(target) {
      descriptorsCache.track(OBJECT_KEYS);
      return Reflect.ownKeys(target);
    },

    set(target, p, value) {
      const hasKey = Reflect.has(target, p);
      const prevValue = Reflect.get(target, p);
      const result = Reflect.set(target, p, value);

      if (!hasKey) {
        descriptorsCache.dirty(OBJECT_KEYS);
        descriptorsCache.dirty(p);
      }

      if (value !== prevValue) propertiesCache.dirty(p);

      return result;
    },

    defineProperty(target, p, attributes) {
      const hasKey = Reflect.has(target, p);
      const result = Reflect.defineProperty(target, p, attributes);
      const value = Reflect.get(target, p);

      if (!hasKey) {
        descriptorsCache.dirty(OBJECT_KEYS);
        descriptorsCache.dirty(p);
      }

      if (value !== undefined) propertiesCache.dirty(p);

      return result;
    },

    deleteProperty(target, p) {
      const hasKey = Reflect.has(target, p);
      const currentValue = Reflect.get(target, p);
      const result = Reflect.deleteProperty(target, p);

      if (hasKey) {
        descriptorsCache.dirty(OBJECT_KEYS);
        descriptorsCache.dirty(p);
      }

      if (currentValue !== undefined) propertiesCache.dirty(p);

      return result;
    },
  };

  return handler;
}
