import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { SignaledSet, createSet } from "../../../src/primitives/set";

import { createComputed, createEffect } from "solid-js";

describe("ReactiveSet - Solid Primitives", () => {
  it("behaves like Set", () => {
    const set = new SignaledSet([1, 1, 2, 3]);
    expect([...set]).toEqual([1, 2, 3]);

    set.add(4);
    expect([...set]).toEqual([1, 2, 3, 4]);

    set.add(4);
    expect([...set]).toEqual([1, 2, 3, 4]);

    expect(set.has(2)).toBeTruthy();
    expect(set.delete(2)).toBeTruthy();
    expect(set.has(2)).toBeFalsy();

    set.clear();
    expect(set.size).toBe(0);

    expect(set).instanceOf(Set);
    expect(set).instanceOf(SignaledSet);
  });

  it("has() is reactive", () =>
    createRoot((dispose) => {
      const set = new SignaledSet([1, 1, 2, 3]);

      const captured: any[] = [];
      createComputed(() => {
        captured.push(set.has(2));
      });
      expect(captured, "1").toEqual([true]);

      set.add(4);
      expect(captured, "2").toEqual([true]);

      set.delete(4);
      expect(captured, "3").toEqual([true]);

      set.delete(2);
      expect(captured, "4").toEqual([true, false]);

      set.add(2);
      expect(captured, "5").toEqual([true, false, true]);

      set.clear();
      expect(captured, "6").toEqual([true, false, true, false]);

      dispose();
    }));

  it("spread is reactive", () =>
    createRoot((dispose) => {
      const set = new SignaledSet([1, 1, 2, 3]);

      const fn = vi.fn();
      createComputed(() => fn([...set]));
      expect(fn).toHaveBeenLastCalledWith([1, 2, 3]);

      set.add(4);
      expect(fn).toHaveBeenLastCalledWith([1, 2, 3, 4]);

      set.delete(4);
      expect(fn).toHaveBeenLastCalledWith([1, 2, 3]);

      set.delete(2);
      expect(fn).toHaveBeenLastCalledWith([1, 3]);

      set.delete(2);
      expect(fn).toBeCalledTimes(4);

      set.add(2);
      expect(fn).toHaveBeenLastCalledWith([1, 3, 2]);

      set.clear();
      expect(fn).toHaveBeenLastCalledWith([]);

      dispose();
    }));

  const iterators: Record<
    string,
    (set: SignaledSet<number>) => IterableIterator<number>
  > = {
    keys: (set) => set.keys(),
    values: (set) => set.values(),
    *entries(set) {
      for (const [key] of set.entries()) {
        yield key;
      }
    },
  };

  for (const [name, fn] of Object.entries(iterators)) {
    it(name + " is reactive", () => {
      const set = new SignaledSet([1, 2, 3, 4]);

      const captured: number[][] = [];

      const dispose = createRoot((dispose) => {
        createEffect(() => {
          const run: number[] = [];
          for (const key of fn(set)) {
            run.push(key);
          }
          captured.push(run);
        });
        return dispose;
      });

      expect(captured).toHaveLength(1);
      expect(captured[0]).toEqual([1, 2, 3, 4]);

      set.delete(4);
      expect(captured).toHaveLength(2);
      expect(captured[1]).toEqual([1, 2, 3]);

      set.delete(1);
      expect(captured).toHaveLength(3);
      expect(captured[2]).toEqual([2, 3]);

      set.add(4);
      expect(captured).toHaveLength(4);
      expect(captured[3]).toEqual([2, 3, 4]);

      set.add(5);
      expect(captured).toHaveLength(5);
      expect(captured[4]).toEqual([2, 3, 4, 5]);

      set.add(5);
      expect(captured).toHaveLength(5);

      set.clear();
      expect(captured).toHaveLength(6);
      expect(captured[5]).toEqual([]);

      dispose();
    });
  }

  it("forEach is reactive", () => {
    const set = new SignaledSet([1, 2, 3, 4]);

    const captured: number[][] = [];

    const dispose = createRoot((dispose) => {
      createEffect(() => {
        const run: number[] = [];
        set.forEach((key) => {
          run.push(key);
        });
        captured.push(run);
      });
      return dispose;
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual([1, 2, 3, 4]);

    set.delete(4);
    expect(captured).toHaveLength(2);
    expect(captured[1]).toEqual([1, 2, 3]);

    set.delete(1);
    expect(captured).toHaveLength(3);
    expect(captured[2]).toEqual([2, 3]);

    set.add(4);
    expect(captured).toHaveLength(4);
    expect(captured[3]).toEqual([2, 3, 4]);

    set.add(5);
    expect(captured).toHaveLength(5);
    expect(captured[4]).toEqual([2, 3, 4, 5]);

    set.add(5);
    expect(captured).toHaveLength(5);

    set.clear();
    expect(captured).toHaveLength(6);
    expect(captured[5]).toEqual([]);

    dispose();
  });
});

describe("SignaledSet", () => {
  it("works with no passed set", () => {
    const spy = vi.fn();

    createRoot(() => {
      const signaledSet = createSet();

      createRenderEffect(() => {
        spy(signaledSet.has("track"));
      });

      expect(spy).toBeCalledTimes(1);

      signaledSet.add("track");
    });

    expect(spy).toBeCalledTimes(2);
  });

  describe("add", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledSet = createSet();

        createRenderEffect(() => {
          spy(signaledSet.has("track"));
        });

        expect(spy).toBeCalledTimes(1);

        signaledSet.add("track");
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks keys", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledSet = createSet();

        createRenderEffect(() => {
          spy([...signaledSet.keys()]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledSet.add("track");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("clear", () => {
    it("notifies on clear", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledSet = createSet(["track"]);

        createRenderEffect(() => {
          spy([...signaledSet.keys()]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledSet.clear();
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("does not notify on empty set", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledSet = createSet();

        createRenderEffect(() => {
          spy([...signaledSet.keys()]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledSet.clear();
      });

      expect(spy).toBeCalledTimes(1);
    });
  });
  describe("delete", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledSet = createSet(["track"]);

        createRenderEffect(() => {
          spy(signaledSet.has("track"));
        });

        expect(spy).toBeCalledTimes(1);

        signaledSet.delete("track");
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks keys", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledSet = createSet(["track"]);

        createRenderEffect(() => {
          spy([...signaledSet.keys()]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledSet.delete("track");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });
});
