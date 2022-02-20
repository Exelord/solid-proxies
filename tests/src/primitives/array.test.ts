import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createArray, SignaledArray } from "../../../src/primitives/array";

describe("SignaledArray", () => {
  it("works with SignaledArray syntax", () => {
    const spy = vi.fn();

    createRoot(() => {
      const signaledArray = new SignaledArray([]);

      createRenderEffect(() => {
        spy(signaledArray[0]);
      });

      expect(spy).toBeCalledTimes(1);

      signaledArray[0] = "yeah";
    });

    expect(spy).toBeCalledTimes(2);
  });

  describe("set", () => {
    it("uses signal to track existing properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = ["me"];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          spy(signaledArray[0]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray[0] = "yeah";
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("uses signal to track new properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = ["me"];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          spy(signaledArray[1]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray[1] = "yeah";
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("uses signal to react on length changes", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = ["me"];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          spy(signaledArray.length);
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray[1] = "yeah";
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("uses signal to create reactive filter", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = [0];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          signaledArray.filter(() => {
            spy();
            return true;
          });
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray[1] = 1;
      });

      expect(spy).toBeCalledTimes(3);
    });
  });
});
