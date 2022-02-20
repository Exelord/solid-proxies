import { createHandler } from "../handlers/object";

export class SignaledObject<T extends Record<PropertyKey, unknown>> {
  static fromEntries(entries: Iterable<readonly [PropertyKey, any]>) {
    return new SignaledObject(Object.fromEntries(entries));
  }

  constructor(obj: T) {
    let proto = Object.getPrototypeOf(obj);
    let descriptors = Object.getOwnPropertyDescriptors(obj);

    let clone = Object.create(proto) as T;

    for (let prop in descriptors) {
      Object.defineProperty(clone, prop, descriptors[prop]);
    }

    return new Proxy(obj, {
      ...createHandler<T>(),
      getPrototypeOf() {
        return SignaledObject.prototype;
      },
    });
  }
}

export function createObject<T extends Record<PropertyKey, unknown>>(
  object: T
): T {
  return new SignaledObject(object) as T;
}
