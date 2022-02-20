import { createCache } from "../utls/cache";

const OBJECT_KEYS = Symbol("objectKeys");

function createProxy(obj = {}) {
  const propsSignals = createCache();
  const keysSignals = createCache();

  return new Proxy(obj, {
    getPrototypeOf() {
      return SignaledObject.prototype;
    },

    get(target, p) {
      propsSignals.track(p);
      return Reflect.get(target, p);
    },

    has(target, p) {
      keysSignals.track(p);
      return Reflect.has(target, p);
    },

    ownKeys(target) {
      keysSignals.track(OBJECT_KEYS);
      return Reflect.ownKeys(target);
    },

    set(target, p, value) {
      const hasKey = Reflect.has(target, p);
      const prevValue = Reflect.get(target, p);
      const result = Reflect.set(target, p, value);

      if (!hasKey) {
        keysSignals.dirty(OBJECT_KEYS);
        keysSignals.dirty(p);
      }

      if (value !== prevValue) propsSignals.dirty(p);

      return result;
    },

    defineProperty(target, p, attributes) {
      const hasKey = Reflect.has(target, p);
      const result = Reflect.defineProperty(target, p, attributes);
      const value = Reflect.get(target, p);

      if (!hasKey) {
        keysSignals.dirty(OBJECT_KEYS);
        keysSignals.dirty(p);
      }

      if (value !== undefined) propsSignals.dirty(p);

      return result;
    },

    deleteProperty(target, p) {
      const hasKey = Reflect.has(target, p);
      const currentValue = Reflect.get(target, p);
      const result = Reflect.deleteProperty(target, p);

      if (hasKey) {
        keysSignals.dirty(OBJECT_KEYS);
        keysSignals.dirty(p);
      }

      if (currentValue !== undefined) propsSignals.dirty(p);

      return result;
    },
  });
}

export class SignaledObject<T extends Record<PropertyKey, unknown>> {
  static fromEntries(entries: Iterable<readonly [PropertyKey, any]>) {
    return new SignaledObject(Object.fromEntries(entries));
  }

  constructor(obj: T) {
    let proto = Object.getPrototypeOf(obj);
    let descs = Object.getOwnPropertyDescriptors(obj);

    let clone = Object.create(proto) as T;

    for (let prop in descs) {
      Object.defineProperty(clone, prop, descs[prop]);
    }

    return createProxy(clone) as T;
  }
}

export function createObject<T extends Record<PropertyKey, unknown>>(
  object: T
) {
  return new SignaledObject(object) as T;
}
