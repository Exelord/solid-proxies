import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createWeakMap } from "../../../src/primitives/weak-map";

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
