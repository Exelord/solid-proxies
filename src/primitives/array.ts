import { createHandler } from "../handlers/array";

interface SignaledArray {
  from<T>(iterable: Iterable<T> | ArrayLike<T>): T[];

  from<T, U>(
    iterable: Iterable<T> | ArrayLike<T>,
    mapfn: (v: T, k: number) => U,
    thisArg?: unknown
  ): T[] | U[];

  from<T, U>(
    iterable: Iterable<T> | ArrayLike<T>,
    mapfn?: (v: T, k: number) => U,
    thisArg?: unknown
  ): T[] | U[];

  of<T>(...arr: T[]): T[];

  new <T = unknown>(array: T[]): T[];
}

const SignaledArray = function <T = unknown>(array: T[]): T[] {
  return new Proxy(array.slice(), {
    ...createHandler<T[]>(),
    getPrototypeOf() {
      return SignaledArray.prototype;
    },
  });
} as any as SignaledArray;

// Ensure instanceof works correctly
Object.setPrototypeOf(SignaledArray.prototype, Array.prototype);

SignaledArray.from = function <T, U>(
  iterable: Iterable<T> | ArrayLike<T>,
  mapfn?: (v: T, k: number) => U,
  thisArg?: unknown
): T[] | U[] {
  return mapfn
    ? new SignaledArray(Array.from(iterable, mapfn, thisArg))
    : new SignaledArray(Array.from(iterable));
};

SignaledArray.of = function <T>(...arr: T[]): T[] {
  return new SignaledArray(arr);
};

export function createArray<T = unknown>(array: T[]): T[] {
  return new SignaledArray(array);
}
