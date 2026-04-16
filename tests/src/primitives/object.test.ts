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

  it("reacts to Object.assign applied to the proxy", () => {
    const spy = vi.fn();

    createRoot(() => {
      const signaledObject = createObject({ a: 1, b: 2 });

      createRenderEffect(() => {
        spy(signaledObject.a, signaledObject.b);
      });

      expect(spy).toBeCalledTimes(1);

      Object.assign(signaledObject, { a: 10, b: 20 });
    });

    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(spy.mock.calls[spy.mock.calls.length - 1]).toEqual([10, 20]);
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

  it("forwards receiver to prototype setters", () => {
    const spy = vi.fn();

    class Counter {
      _n = 0;
      get n() {
        return this._n;
      }
      set n(v: number) {
        this._n = v;
      }
    }

    createRoot(() => {
      const c = createObject(new Counter());

      createRenderEffect(() => {
        spy(c._n);
      });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith(0);

      c.n = 5;
    });

    expect(spy).toBeCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(5);
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

    it("notifies Object.keys consumers when a setter on the prototype creates a new own key", () => {
      const spy = vi.fn();

      const proto = {
        set foo(v: number) {
          Object.defineProperty(this, "_foo", {
            value: v,
            enumerable: true,
            configurable: true,
            writable: true,
          });
        },
      };

      createRoot(() => {
        const signaledObject = createObject(
          Object.create(proto) as { foo?: number; _foo?: number }
        );

        createRenderEffect(() => {
          spy(Object.keys(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith([]);

        signaledObject.foo = 5;
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(["_foo"]);
    });

    it("notifies descriptor consumers when an existing key's value changes via set", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({ x: 1 });

        createRenderEffect(() => {
          spy(Object.getOwnPropertyDescriptor(signaledObject, "x")?.value);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(1);

        signaledObject.x = 2;
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(2);
    });

    it("does not invoke an accessor getter when redefining the property", () => {
      const getter = vi.fn(() => 1);
      const base = Object.defineProperty({}, "x", {
        get: getter,
        configurable: true,
      });

      const signaledObject = createObject(base);
      const callsBefore = getter.mock.calls.length;

      Object.defineProperty(signaledObject, "x", {
        value: 2,
        configurable: true,
        writable: true,
      });

      expect(getter.mock.calls.length).toBe(callsBefore);
    });

    it("does not invoke a side-effecting getter more than necessary", () => {
      const getter = vi.fn(() => 1);
      const base: { x: number } = Object.defineProperty(
        {} as { x: number },
        "x",
        {
          get: getter,
          set() {},
          configurable: true,
          enumerable: true,
        }
      );

      const signaledObject = createObject(base);
      const callsBefore = getter.mock.calls.length;

      signaledObject.x = 2;

      expect(getter.mock.calls.length - callsBefore).toBeLessThanOrEqual(1);
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
          enumerable: true,
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

    it("notifies consumers when a property is redefined to undefined", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({ x: 1 } as {
          x: number | undefined;
        });

        createRenderEffect(() => {
          spy(signaledObject.x);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(1);

        Object.defineProperty(signaledObject, "x", { value: undefined });
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(undefined);
    });

    it("does not notify consumers when the value is unchanged", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({ x: 1 });

        createRenderEffect(() => {
          spy(signaledObject.x);
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "x", { value: 1 });
      });

      expect(spy).toBeCalledTimes(1);
    });

    it("does not notify Object.keys consumers when defining a non-enumerable property", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({} as Record<string, number>);

        createRenderEffect(() => {
          spy(Object.keys(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "hidden", {
          value: 1,
          enumerable: false,
        });
      });

      expect(spy).toBeCalledTimes(1);
    });

    it("notifies descriptor consumers when only the descriptor attributes change", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({ x: 1 });

        createRenderEffect(() => {
          spy(Object.getOwnPropertyDescriptor(signaledObject, "x"));
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy.mock.calls[0][0]?.enumerable).toBe(true);

        Object.defineProperty(signaledObject, "x", { enumerable: false });
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[1][0]?.enumerable).toBe(false);
    });

    it("notifies Object.keys consumers when flipping enumerable to false", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({ x: 1 });

        createRenderEffect(() => {
          spy(Object.keys(signaledObject));
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(["x"]);

        Object.defineProperty(signaledObject, "x", { enumerable: false });
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith([]);
    });

    it("does not notify has consumers when only the value changes via defineProperty", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({ x: 1 });

        createRenderEffect(() => {
          spy("x" in signaledObject);
        });

        expect(spy).toBeCalledTimes(1);

        Object.defineProperty(signaledObject, "x", { value: 2 });
      });

      expect(spy).toBeCalledTimes(1);
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

  describe("setPrototypeOf", () => {
    it("notifies consumers reading an inherited property when the prototype changes", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject(
          {} as Record<string, unknown>
        ) as any;

        createRenderEffect(() => {
          spy(signaledObject.inherited);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(undefined);

        Object.setPrototypeOf(signaledObject, { inherited: 1 });
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(1);
    });

    it("notifies consumers when the prototype changes", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({} as Record<string, unknown>);

        createRenderEffect(() => {
          spy("inherited" in signaledObject);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith(false);

        Object.setPrototypeOf(signaledObject, { inherited: 1 });
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(true);
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

    it("does not notify consumers when deletion silently fails on a non-configurable property", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({} as Record<string, number>);
        Object.defineProperty(signaledObject, "track", {
          value: 1,
          configurable: false,
        });

        createRenderEffect(() => {
          spy(signaledObject.track);
        });

        expect(spy).toBeCalledTimes(1);

        try {
          delete signaledObject.track;
        } catch {}
      });

      expect(spy).toBeCalledTimes(1);
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

    it("notifies consumers when deleting a key whose value was undefined", () => {
      const spy = vi.fn();

      createRoot(() => {
        const signaledObject = createObject({ track: undefined } as {
          track: string | undefined;
        });

        createRenderEffect(() => {
          spy(signaledObject.track);
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
