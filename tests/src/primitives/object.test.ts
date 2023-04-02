import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createObject } from "../../../src/primitives/object";

describe("SignaledObject", () => {
  describe("set", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" };
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(signaledObject.track);
        });

        expect(spy).toBeCalledTimes(1);

        signaledObject.track = "yeah";
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks keys", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.keys(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);

        signaledObject.track = "me";
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks specific key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy("track" in signaledObject);
        });

        expect(spy).toBeCalledTimes(1);

        signaledObject.track = "value";
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks property descriptor key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.getOwnPropertyDescriptor(signaledObject, "track"));
        });

        expect(spy).toBeCalledTimes(1);

        signaledObject.track = "value";
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("defineProperty", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(signaledObject.track);
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "track", {
          value: "me",
        });
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks keys", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.keys(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "track", {
          value: "me",
        });
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks specific key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy("track" in signaledObject);
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "track", {
          value: "me",
        });
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("defines existing key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" } as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy("track" in signaledObject);
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "track", {
          value: "me",
        });
      });

      expect(spy).toBeCalledTimes(1);
    });

    it("tracks property descriptor key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.getOwnPropertyDescriptor(signaledObject, "track"));
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "track", {
          value: "me",
        });
      });

      expect(spy).toBeCalledTimes(2);
    });
  });

  describe("deleteProperty", () => {
    it("uses signal to track properties", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" };
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(signaledObject.track);
        });

        expect(spy).toBeCalledTimes(1);

        delete signaledObject.track;
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks keys", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" };
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.keys(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);

        delete signaledObject.track;
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks specific key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" };
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy("track" in signaledObject);
        });

        expect(spy).toBeCalledTimes(1);

        delete signaledObject.track;
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("deletes non-existing key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = {} as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy("track" in signaledObject);
        });

        expect(spy).toBeCalledTimes(1);

        delete signaledObject.track;
      });

      expect(spy).toBeCalledTimes(1);
    });

    it("tracks property descriptor key", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" } as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.getOwnPropertyDescriptor(signaledObject, "track"));
        });

        expect(spy).toBeCalledTimes(1);

        delete signaledObject.track;
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks after descriptor has been removed", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" } as any;
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(signaledObject.track);
        });

        expect(spy).toBeCalledTimes(1);

        delete signaledObject.track;

        signaledObject.track = "you";
      });

      expect(spy).nthCalledWith(1, "me");
      expect(spy).nthCalledWith(2, "you");
    });
  });
});
