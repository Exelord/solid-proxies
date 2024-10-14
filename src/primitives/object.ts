import { createHandler } from "../handlers/object";

interface SignaledObject {
  fromEntries<T = unknown>(
    entries: Iterable<readonly [PropertyKey, T]>
  ): { [key: PropertyKey]: T };

  new <T extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>>(
    obj: T
  ): T;
}

const SignaledObject = function <T extends Record<PropertyKey, unknown>>(
  obj: T
): T {
  let proto = Object.getPrototypeOf(obj);
  let descriptors = Object.getOwnPropertyDescriptors(obj);

  let clone = Object.create(proto) as T;

  for (let prop in descriptors) {
    Object.defineProperty(clone, prop, descriptors[prop]);
  }

  return new Proxy(clone, {
    ...createHandler<T>(),
    getPrototypeOf() {
      return SignaledObject.prototype;
    },
  });
} as any as SignaledObject;

SignaledObject.fromEntries = function <T = unknown>(
  entries: Iterable<readonly [PropertyKey, T]>
): { [key: PropertyKey]: T } {
  return new SignaledObject(Object.fromEntries(entries));
};

export function createObject<T extends Record<PropertyKey, unknown>>(
  object: T
): T {
  return new SignaledObject(object);
}
