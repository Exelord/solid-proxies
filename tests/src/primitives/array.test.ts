import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createArray } from "../../../src/primitives/array";

describe("SignaledArray", () => {
  describe("Array.prototype.push", () => {
    it("items that has been added do react", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = ["1", "2", "3"];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          spy(signaledArray[3]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray.push("4");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("Array.prototype.splice", () => {
    it("items that did change do react to splice", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = ["1", "2", "3"];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          spy(signaledArray[2]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray.splice(1, 1);

        expect(signaledArray).toEqual(["1", "3"]);
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("collection reacts to splice", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = ["1", "2", "3"];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          spy(signaledArray.forEach(() => {}));
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray.splice(1, 1);

        expect(signaledArray).toEqual(["1", "3"]);
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("items that didn't change do not react to splice", () => {
      const spy = vi.fn();

      createRoot(() => {
        const array = ["1", "2", "3"];
        const signaledArray = createArray(array);

        createRenderEffect(() => {
          spy(signaledArray[0]);
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray.splice(1, 1);

        expect(signaledArray).toEqual(["1", "3"]);
      });

      expect(spy).toBeCalledTimes(1);
    });
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

    it("notifies consumers when an index is deleted", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledArray = createArray([1, 2, 3]);

        createRenderEffect(() => {
          spy(signaledArray[1]);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(2);

        delete signaledArray[1];
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(undefined);
    });

    it("notifies index and length consumers after pop", () => {
      const lengthSpy = vi.fn();
      const tailSpy = vi.fn();

      createRoot(() => {
        const signaledArray = createArray([1, 2, 3]);

        createRenderEffect(() => {
          lengthSpy(signaledArray.length);
        });
        createRenderEffect(() => {
          tailSpy(signaledArray[2]);
        });

        expect(lengthSpy).toHaveBeenLastCalledWith(3);
        expect(tailSpy).toHaveBeenLastCalledWith(3);

        signaledArray.pop();
      });

      expect(lengthSpy).toHaveBeenLastCalledWith(2);
      expect(tailSpy).toHaveBeenLastCalledWith(undefined);
    });

    it("notifies length consumers when length grows", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledArray = createArray([1]);

        createRenderEffect(() => {
          spy(signaledArray.length);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(1);

        signaledArray.length = 3;
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(3);
    });

    it("does not notify when length is assigned its current value", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledArray = createArray([1, 2, 3]);

        createRenderEffect(() => {
          spy(signaledArray.length);
        });

        expect(spy).toBeCalledTimes(1);

        signaledArray.length = 3;
      });

      expect(spy).toBeCalledTimes(1);
    });

    it("notifies index consumers after sort", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledArray = createArray([3, 1, 2]);

        createRenderEffect(() => {
          spy(signaledArray[0]);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(3);

        signaledArray.sort();
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(1);
    });

    it("notifies index consumers after reverse", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledArray = createArray([1, 2, 3]);

        createRenderEffect(() => {
          spy(signaledArray[0]);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(1);

        signaledArray.reverse();
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(3);
    });

    it("invalidates removed indices when length is truncated", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledArray = createArray([1, 2, 3]);

        createRenderEffect(() => {
          spy(signaledArray[2]);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(3);

        signaledArray.length = 0;
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(undefined);
    });
  });
});
