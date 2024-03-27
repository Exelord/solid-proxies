import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createSet } from "../../../src/primitives/set";

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
        const set = new Set();
        const signaledSet = createSet(set);

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
        const set = new Set();
        const signaledSet = createSet(set);

        createRenderEffect(() => {
          spy(signaledSet.keys());
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
        const set = new Set(["track"]);
        const signaledSet = createSet(set);

        createRenderEffect(() => {
          spy(signaledSet.keys());
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
          spy(signaledSet.keys());
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
        const set = new Set(["track"]);
        const signaledSet = createSet(set);

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
        const set = new Set(["track"]);
        const signaledSet = createSet(set);

        createRenderEffect(() => {
          spy(signaledSet.keys());
        });

        expect(spy).toBeCalledTimes(1);

        signaledSet.delete("track");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });
});
