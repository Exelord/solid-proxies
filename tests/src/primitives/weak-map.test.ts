import { createComputed, createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import {
  SignaledWeakMap,
  createWeakMap,
} from "../../../src/primitives/weak-map";

const trackSymbol = {};

describe("SignaledWeakMap", () => {
  it("works with no passed map", () => {
    const spy = vi.fn();

    createRoot(() => {
      const signaledWeakMap = createWeakMap();

      createRenderEffect(() => {
        spy(signaledWeakMap.get(trackSymbol));
      });

      expect(spy).toBeCalledTimes(1);

      signaledWeakMap.set(trackSymbol, "yeah");
    });

    expect(spy).toBeCalledTimes(2);
  });

  describe("get & set", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledWeakMap = createWeakMap([[trackSymbol, "me"]]);

        createRenderEffect(() => {
          spy(signaledWeakMap.get(trackSymbol));
        });

        expect(spy).toBeCalledTimes(1);

        signaledWeakMap.set(trackSymbol, "yeah");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("has", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledWeakMap = createWeakMap();

        createRenderEffect(() => {
          spy(signaledWeakMap.has(trackSymbol));
        });

        expect(spy).toBeCalledTimes(1);

        signaledWeakMap.set(trackSymbol, "yeah");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("delete", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledWeakMap = createWeakMap([[trackSymbol, "me"]]);

        createRenderEffect(() => {
          spy(signaledWeakMap.get(trackSymbol));
        });

        expect(spy).toBeCalledTimes(1);

        signaledWeakMap.delete(trackSymbol);
      });

      expect(spy).toBeCalledTimes(2);
    });
  });
});

describe("ReactiveWeakMap - Solid Primitives", () => {
  it("behaves like a Map", () => {
    const obj1 = {};
    const obj2 = {};

    const map = new SignaledWeakMap<object, any>([[obj1, 123]]);

    expect(map.has(obj1)).toBe(true);
    expect(map.has(obj2)).toBe(false);

    expect(map.get(obj1)).toBe(123);

    map.set(obj2, "bar");
    expect(map.get(obj2)).toBe("bar");
    map.set(obj1, "change");
    expect(map.get(obj1)).toBe("change");

    expect(map.delete(obj2)).toBe(true);
    expect(map.has(obj2)).toBe(false);

    expect(map).instanceOf(WeakMap);
    expect(map).instanceOf(SignaledWeakMap);
  });

  it("is reactive", () => {
    createRoot((dispose) => {
      const obj1 = {};
      const obj2 = {};
      const obj3 = {};
      const obj4 = {};

      const map = new SignaledWeakMap<object, any>([
        [obj1, 123],
        [obj2, 123],
      ]);

      const captured: any[] = [];
      createComputed(() => {
        captured.push(map.has(obj1));
      });
      expect(captured, "1").toEqual([true]);

      map.set(obj3, {});
      expect(captured, "2").toEqual([true]);

      map.delete(obj3);
      expect(captured, "3").toEqual([true]);

      map.delete(obj1);
      expect(captured, "4").toEqual([true, false]);

      map.set(obj1, {});
      expect(captured, "5").toEqual([true, false, true]);

      map.set(obj4, {});
      expect(captured, "7").toEqual([true, false, true]);

      map.set(obj1, {});
      expect(captured, "8").toEqual([true, false, true]);

      dispose();
    });
  });
});
