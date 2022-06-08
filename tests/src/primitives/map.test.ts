import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createMap } from "../../../src/primitives/map";

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
        const map = new Map([["track", "me"]]);
        const signaledMap = createMap(map);

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
        const map = new Map();
        const signaledMap = createMap(map);

        createRenderEffect(() => {
          spy(signaledMap.keys());
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
        const map = new Map([["track", "me"]]);
        const signaledMap = createMap(map);

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
        const map = new Map([["track", "me"]]);
        const signaledMap = createMap(map);

        createRenderEffect(() => {
          spy(signaledMap.keys());
        });

        expect(spy).toBeCalledTimes(1);

        signaledMap.delete("track");
      });

      expect(spy).toBeCalledTimes(2);
    });
  });
});
