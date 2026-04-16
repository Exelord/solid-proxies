import { createRenderEffect, createRoot } from "solid-js";
import { describe, it, expect, vi } from "vitest";
import { createObject } from "../../../src/primitives/object";

describe("SignaledObject", () => {
  it("works good with types", () => {
    interface State {}
    createObject<State>({});
  });

  it("clones object", () => {
    const obj = { track: "me" };
    const signaledObject = createObject(obj);

    signaledObject.track = "you";

    expect(obj.track).toBe("me");
    expect(signaledObject.track).toBe("you");
  });

  it("creates a mutable proxy even when the input is frozen", () => {
    const original = Object.freeze({ x: 1 });
    const signaledObject = createObject(original);

    signaledObject.x = 2;
    expect(signaledObject.x).toBe(2);
  });

  it("preserves the source prototype chain for instanceof checks", () => {
    class Source {}
    const signaledObject = createObject(new Source());

    expect(signaledObject instanceof Source).toBe(true);
  });

  it("reflects prototype changes via getPrototypeOf", () => {
    const signaledObject = createObject({});

    const newProto = { inherited: true };
    Object.setPrototypeOf(signaledObject, newProto);

    expect(Object.getPrototypeOf(signaledObject)).toBe(newProto);
  });

  it("preserves accessor properties when cloning", () => {
    const original = {};
    Object.defineProperty(original, "answer", {
      get() {
        return 42;
      },
      enumerable: true,
      configurable: true,
    });

    const signaledObject = createObject(original) as { answer: number };

    expect(signaledObject.answer).toBe(42);
    const desc = Object.getOwnPropertyDescriptor(signaledObject, "answer");
    expect(desc?.get).toBeTypeOf("function");
  });

  it("preserves symbol-keyed properties when cloning", () => {
    const id = Symbol("id");
    const original = { name: "a", [id]: 42 } as {
      name: string;
      [key: symbol]: number;
    };

    const signaledObject = createObject(original);

    expect(signaledObject[id]).toBe(42);
    expect(Object.getOwnPropertySymbols(signaledObject)).toContain(id);
  });

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

    it("tracks values", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" };
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.values(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);

        signaledObject.track = "you";
      });

      expect(spy).toBeCalledTimes(2);
    });

    it("tracks entries", () => {
      const spy = vi.fn();

      createRoot(() => {
        const object = { track: "me" };
        const signaledObject = createObject(object);

        createRenderEffect(() => {
          spy(Object.entries(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);

        signaledObject.track = "you";
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
