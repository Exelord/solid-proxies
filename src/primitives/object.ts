import { createHandler } from "../handlers/object";

interface SignaledObject {
  fromEntries<T = unknown>(
    entries: Iterable<readonly [PropertyKey, T]>
  ): { [key: PropertyKey]: T };

  new <T extends object>(obj: T): T;
}

const SignaledObject = function <T extends object>(obj: T): T {
  let proto = Object.getPrototypeOf(obj);
  let descriptors = Object.getOwnPropertyDescriptors(obj);

  for (const key of Reflect.ownKeys(descriptors)) {
    const d = (descriptors as Record<PropertyKey, PropertyDescriptor>)[
      key as PropertyKey
    ];
    d.configurable = true;
    if ("writable" in d) d.writable = true;
  }

  let clone = Object.create(proto, descriptors) as T;

  return new Proxy(clone, createHandler<T>());
} as any as SignaledObject;

SignaledObject.fromEntries = function <T = unknown>(
  entries: Iterable<readonly [PropertyKey, T]>
): { [key: PropertyKey]: T } {
  return new SignaledObject(Object.fromEntries(entries));
};

export function createObject<T extends object>(object: T): T {
  return new SignaledObject(object);
}
