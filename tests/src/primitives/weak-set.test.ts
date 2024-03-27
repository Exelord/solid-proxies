import { createComputed, createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import {
  SignaledWeakSet,
  createWeakSet,
} from "../../../src/primitives/weak-set";

const trackedObject = {};

describe("SignaledWeakSet", () => {
  describe("add", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledWeakSet = createWeakSet();

        createRenderEffect(() => {
          spy(signaledWeakSet.has(trackedObject));
        });

        expect(spy).toBeCalledTimes(1);

        signaledWeakSet.add(trackedObject);
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("delete", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledWeakSet = createWeakSet([trackedObject]);

        createRenderEffect(() => {
          spy(signaledWeakSet.has(trackedObject));
        });

        expect(spy).toBeCalledTimes(1);

        signaledWeakSet.delete(trackedObject);
      });

      expect(spy).toBeCalledTimes(2);
    });
  });
});

describe("ReactiveWeakSet - Solid Primitives", () => {
  it("behaves like a WeakSet", () => {
    const a = {};
    const b = {};
    const c = {};
    const d = {};
    const e = {};

    const set = new SignaledWeakSet([a, a, b, c, d]);
    expect(set.has(a)).toBeTruthy();
    expect(set.has(b)).toBeTruthy();
    expect(set.has(c)).toBeTruthy();
    expect(set.has(d)).toBeTruthy();
    expect(set.has(e)).toBeFalsy();

    set.add(e);
    expect(set.has(e)).toBeTruthy();
    set.add(e);

    expect(set.delete(a)).toBeTruthy();
    expect(set.has(a)).toBeFalsy();

    expect(set).instanceOf(WeakSet);
    expect(set).instanceOf(SignaledWeakSet);
  });

  it("is reactive", () => {
    createRoot((dispose) => {
      const a = {};
      const b = {};
      const c = {};
      const d = {};
      const e = {};

      const set = new SignaledWeakSet([a, a, b, c, d]);

      const captured: any[] = [];
      createComputed(() => {
        captured.push(set.has(e));
      });
      expect(captured, "1").toEqual([false]);

      set.add(e);
      expect(captured, "2").toEqual([false, true]);

      set.delete(e);
      expect(captured, "3").toEqual([false, true, false]);

      set.delete(a);
      expect(captured, "4").toEqual([false, true, false]);

      set.add(a);
      expect(captured, "5").toEqual([false, true, false]);

      set.add(e);
      expect(captured, "6").toEqual([false, true, false, true]);

      dispose();
    });
  });
});
