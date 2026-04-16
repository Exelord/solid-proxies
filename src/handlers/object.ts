import { batch } from "solid-js";
import { createCache, track, dirty, dirtyAll } from "../utils/cache";

export const OBJECT_KEYS = Symbol("objectKeys");

function descriptorsDiffer(
  a: PropertyDescriptor | undefined,
  b: PropertyDescriptor | undefined
): boolean {
  if (a === b) return false;
  if (!a || !b) return true;
  return (
    a.value !== b.value ||
    a.writable !== b.writable ||
    a.enumerable !== b.enumerable ||
    a.configurable !== b.configurable ||
    a.get !== b.get ||
    a.set !== b.set
  );
}

function isAccessor(d: PropertyDescriptor | undefined): boolean {
  return !!d && (d.get !== undefined || d.set !== undefined);
}

function valueChanged(
  prev: PropertyDescriptor | undefined,
  next: PropertyDescriptor | undefined
): boolean {
  if (isAccessor(prev) || isAccessor(next)) {
    return descriptorsDiffer(prev, next);
  }
  return prev?.value !== next?.value;
}

export interface ObjectProxyHandler<T extends object> extends ProxyHandler<T> {
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

export function createHandler<T extends object>(
  propertiesCache = createCache(),
  descriptorsCache = createCache(),
  existenceCache = createCache()
): ObjectProxyHandler<T> {
  const handler: ObjectProxyHandler<T> = {
    get(target, p, receiver) {
      track(p, propertiesCache);
      return Reflect.get(target, p, receiver);
    },

    has(target, p) {
      track(p, existenceCache);
      return Reflect.has(target, p);
    },

    getOwnPropertyDescriptor(target: T, p: string | symbol) {
      track(p, descriptorsCache);
      return Reflect.getOwnPropertyDescriptor(target, p);
    },

    ownKeys(target) {
      track(OBJECT_KEYS, descriptorsCache);
      return Reflect.ownKeys(target);
    },

    set(target, p, value, receiver) {
      const hasKey = Reflect.has(target, p);
      const prevValue = Reflect.get(target, p, receiver);
      const result = Reflect.set(target, p, value, receiver);

      batch(() => {
        if (!hasKey) {
          dirty(OBJECT_KEYS, descriptorsCache);
          dirty(p, descriptorsCache);
          dirty(p, existenceCache);
        }

        if (value !== prevValue) dirty(p, propertiesCache);
      });

      return result;
    },

    defineProperty(target, p, attributes) {
      const prevDescriptor = Reflect.getOwnPropertyDescriptor(target, p);
      const result = Reflect.defineProperty(target, p, attributes);
      const nextDescriptor = Reflect.getOwnPropertyDescriptor(target, p);

      batch(() => {
        const wasEnumerable = prevDescriptor?.enumerable ?? false;
        const isEnumerable = nextDescriptor?.enumerable ?? false;
        if (wasEnumerable !== isEnumerable) {
          dirty(OBJECT_KEYS, descriptorsCache);
        }

        if (!prevDescriptor !== !nextDescriptor) {
          dirty(p, existenceCache);
        }

        if (descriptorsDiffer(prevDescriptor, nextDescriptor)) {
          dirty(p, descriptorsCache);
        }

        if (valueChanged(prevDescriptor, nextDescriptor)) {
          dirty(p, propertiesCache);
        }
      });

      return result;
    },

    deleteProperty(target, p) {
      const hasKey = Reflect.has(target, p);
      const result = Reflect.deleteProperty(target, p);

      if (hasKey && result) {
        batch(() => {
          dirty(OBJECT_KEYS, descriptorsCache);
          dirty(p, descriptorsCache);
          dirty(p, existenceCache);
          dirty(p, propertiesCache);
        });
      }

      return result;
    },

    setPrototypeOf(target, v) {
      const prev = Reflect.getPrototypeOf(target);
      const result = Reflect.setPrototypeOf(target, v);

      if (result && prev !== v) {
        batch(() => {
          dirtyAll(descriptorsCache);
          dirtyAll(existenceCache);
          dirtyAll(propertiesCache);
        });
      }

      return result;
    },
  };

  return handler;
}
