import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createWeakSet } from "../../../src/primitives/weak-set";

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
