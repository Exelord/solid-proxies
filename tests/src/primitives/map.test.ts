import {
  createComputed,
  createEffect,
  createRenderEffect,
  createRoot,
} from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { SignaledMap, createMap } from "../../../src/primitives/map";

describe("SignaledMap", () => {
  it("works with no passed map", () => {
    const spy = vi.fn();

    createRoot(() => {
      const signaledMap = createMap();

      createRenderEffect(() => {
        spy(signaledMap.get("track"));
      });

      expect(spy).toBeCalledTimes(1);

      signaledMap.set("track", "yeah");
    });

    expect(spy).toBeCalledTimes(2);
  });

  describe("set", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledMap = createMap([["track", "me"]]);

        createRenderEffect(() => {
          spy(signaledMap.get("track"));
        });

        expect(spy).toBeCalledTimes(1);

        signaledMap.set("track", "yeah");
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks keys", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledMap = createMap();

        createRenderEffect(() => {
          spy([...signaledMap.keys()]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledMap.set("track", "me");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("delete", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledMap = createMap([["track", "me"]]);

        createRenderEffect(() => {
          spy(signaledMap.get("track"));
        });

        expect(spy).toBeCalledTimes(1);

        signaledMap.delete("track");
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks keys", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledMap = createMap([["track", "me"]]);

        createRenderEffect(() => {
          spy([...signaledMap.keys()]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledMap.delete("track");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });
});

describe("ReactiveMap - Solid Proxies", () => {
  it("behaves like a Map", () => {
    const obj1 = {};
    const obj2 = {};

    const map = new SignaledMap<any, any>([
      [obj1, 123],
      [1, "foo"],
    ]);

    expect(map.has(obj1)).toBe(true);
    expect(map.has(1)).toBe(true);
    expect(map.has(2)).toBe(false);

    expect(map.get(obj1)).toBe(123);
    expect(map.get(1)).toBe("foo");

    map.set(obj2, "bar");
    expect(map.get(obj2)).toBe("bar");
    map.set(obj1, "change");
    expect(map.get(obj1)).toBe("change");

    expect(map.delete(obj2)).toBe(true);
    expect(map.has(obj2)).toBe(false);

    expect(map.size).toBe(2);
    map.clear();
    expect(map.size).toBe(0);

    expect(map).instanceOf(Map);
    expect(map).instanceOf(SignaledMap);
  });

  it("has() is reactive", () =>
    createRoot((dispose) => {
      const map = new SignaledMap([
        [1, {}],
        [1, {}],
        [2, {}],
        [3, {}],
      ]);

      const captured: any[] = [];
      createComputed(() => {
        captured.push(map.has(2));
      });
      expect(captured, "1").toEqual([true]);

      map.set(4, {});
      expect(captured, "2").toEqual([true]);

      map.delete(4);
      expect(captured, "3").toEqual([true]);

      map.delete(2);
      expect(captured, "4").toEqual([true, false]);

      map.set(2, {});
      expect(captured, "5").toEqual([true, false, true]);

      map.clear();
      expect(captured, "6").toEqual([true, false, true, false]);

      dispose();
    }));

  it("get() is reactive", () => {
    createRoot((dispose) => {
      const obj1 = {};
      const obj2 = {};
      const obj3 = {};
      const obj4 = {};

      const map = new SignaledMap([
        [1, obj1],
        [1, obj2],
        [2, obj3],
        [3, obj4],
      ]);

      const fn = vi.fn();
      createComputed(() => fn(map.get(2)));
      expect(fn).toHaveBeenLastCalledWith({});

      map.set(4, {});
      expect(fn).toBeCalledTimes(1);

      map.delete(4);
      expect(fn).toBeCalledTimes(1);

      map.delete(2);
      expect(fn).toHaveBeenLastCalledWith(undefined);

      map.set(2, obj4);
      expect(fn).toHaveBeenLastCalledWith(obj4);

      map.set(2, obj4);
      expect(fn).toBeCalledTimes(3);

      map.clear();
      expect(fn).toHaveBeenLastCalledWith(undefined);

      dispose();
    });
  });

  it("spread values is reactive", () => {
    const map = new SignaledMap([
      [1, "a"],
      [1, "b"],
      [2, "c"],
      [3, "d"],
    ]);

    const captured: any[] = [];

    const dispose = createRoot((dispose) => {
      createEffect(() => captured.push([...map.values()]));
      return dispose;
    });

    expect(captured, "1").toHaveLength(1);
    expect(captured[0], "1").toEqual(["b", "c", "d"]);

    map.set(4, "e");
    expect(captured, "2").toHaveLength(2);
    expect(captured[1], "2").toEqual(["b", "c", "d", "e"]);

    map.set(4, "e");
    expect(captured, "3").toHaveLength(2);

    map.delete(4);
    expect(captured, "4").toHaveLength(3);
    expect(captured[2], "4").toEqual(["b", "c", "d"]);

    map.delete(2);
    expect(captured, "5").toHaveLength(4);
    expect(captured[3], "5").toEqual(["b", "d"]);

    map.delete(2);
    expect(captured, "6").toHaveLength(4);

    map.set(2, "a");
    expect(captured, "7").toHaveLength(5);
    expect(captured[4], "7").toEqual(["b", "d", "a"]);

    map.set(2, "b");
    expect(captured, "8").toHaveLength(6);
    expect(captured[5], "8").toEqual(["b", "d", "b"]);

    map.clear();
    expect(captured, "9").toHaveLength(7);
    expect(captured[6], "9").toEqual([]);

    dispose();
  });

  it(".size is reactive", () => {
    createRoot((dispose) => {
      const map = new SignaledMap([
        [1, {}],
        [1, {}],
        [2, {}],
        [3, {}],
      ]);

      const captured: any[] = [];
      createComputed(() => {
        captured.push(map.size);
      });
      expect(captured, "1").toHaveLength(1);
      expect(captured[0], "1").toEqual(3);

      map.set(4, {});
      expect(captured, "2").toHaveLength(2);
      expect(captured[1], "2").toEqual(4);

      map.delete(4);
      expect(captured, "3").toHaveLength(3);
      expect(captured[2], "3").toEqual(3);

      map.delete(2);
      expect(captured, "4").toHaveLength(4);
      expect(captured[3], "4").toEqual(2);

      map.delete(2);
      expect(captured, "5").toHaveLength(4);

      map.set(2, {});
      expect(captured, "6").toHaveLength(5);
      expect(captured[4], "6").toEqual(3);

      map.set(2, {});
      expect(captured, "7").toHaveLength(5);

      map.clear();
      expect(captured, "8").toHaveLength(6);
      expect(captured[5], "8").toEqual(0);

      dispose();
    });
  });

  it(".keys() is reactive", () => {
    const map = new SignaledMap([
      [1, "a"],
      [2, "b"],
      [3, "c"],
      [4, "d"],
    ]);

    const captured: unknown[][] = [];

    const dispose = createRoot((dispose) => {
      createEffect(() => {
        const run: unknown[] = [];
        for (const key of map.keys()) {
          run.push(key);
          if (key === 3) break; // don't iterate over all keys
        }
        captured.push(run);
      });
      return dispose;
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual([1, 2, 3]);

    map.set(1, "e");
    expect(captured, "value change").toHaveLength(1);

    map.set(5, "f");
    expect(captured, "not seen key change").toHaveLength(1);

    map.delete(1);
    expect(captured, "seen key change").toHaveLength(2);
    expect(captured[1]).toEqual([2, 3]);

    dispose();
  });

  it(".values() is reactive", () => {
    const map = new SignaledMap([
      [1, "a"],
      [2, "b"],
      [3, "c"],
      [4, "d"],
    ]);

    const captured: unknown[][] = [];

    const dispose = createRoot((dispose) => {
      createEffect(() => {
        const run: unknown[] = [];
        let i = 0;
        for (const v of map.values()) {
          run.push(v);
          if (i === 2) break; // don't iterate over all keys
          i += 1;
        }
        captured.push(run);
      });
      return dispose;
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual(["a", "b", "c"]);

    map.set(1, "e");
    expect(captured, "value change").toHaveLength(2);
    expect(captured[1]).toEqual(["e", "b", "c"]);

    map.set(4, "f");
    expect(captured, "not seen value change").toHaveLength(2);

    map.delete(4);
    expect(captured, "not seen key change").toHaveLength(2);

    map.delete(1);
    expect(captured, "seen key change").toHaveLength(3);
    expect(captured[2]).toEqual(["b", "c"]);

    dispose();
  });

  it(".entries() is reactive", () => {
    const map = new SignaledMap([
      [1, "a"],
      [2, "b"],
      [3, "c"],
      [4, "d"],
    ]);

    const captured: unknown[][] = [];

    const dispose = createRoot((dispose) => {
      createEffect(() => {
        const run: unknown[] = [];
        let i = 0;
        for (const e of map.entries()) {
          run.push(e);
          if (i === 2) break; // don't iterate over all keys
          i += 1;
        }
        captured.push(run);
      });
      return dispose;
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual([
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ]);

    map.set(1, "e");
    expect(captured, "value change").toHaveLength(2);
    expect(captured[1]).toEqual([
      [1, "e"],
      [2, "b"],
      [3, "c"],
    ]);

    map.set(4, "f");
    expect(captured, "not seen value change").toHaveLength(2);

    map.delete(4);
    expect(captured, "not seen key change").toHaveLength(2);

    map.delete(1);
    expect(captured, "seen key change").toHaveLength(3);
    expect(captured[2]).toEqual([
      [2, "b"],
      [3, "c"],
    ]);

    dispose();
  });

  it(".forEach() is reactive", () => {
    const map = new SignaledMap([
      [1, "a"],
      [2, "b"],
      [3, "c"],
      [4, "d"],
    ]);

    const captured: unknown[][] = [];

    const dispose = createRoot((dispose) => {
      createEffect(() => {
        const run: unknown[] = [];
        map.forEach((v, k) => {
          run.push([k, v]);
        });
        captured.push(run);
      });
      return dispose;
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual([
      [1, "a"],
      [2, "b"],
      [3, "c"],
      [4, "d"],
    ]);

    map.set(1, "e");
    expect(captured).toHaveLength(2);
    expect(captured[1]).toEqual([
      [1, "e"],
      [2, "b"],
      [3, "c"],
      [4, "d"],
    ]);

    map.delete(4);
    expect(captured).toHaveLength(3);
    expect(captured[2]).toEqual([
      [1, "e"],
      [2, "b"],
      [3, "c"],
    ]);

    dispose();
  });
});
