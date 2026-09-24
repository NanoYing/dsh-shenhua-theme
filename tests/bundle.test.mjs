import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import * as jsxRuntime from "react/jsx-runtime";

test("browser bundle mounts and fully removes styles, palette and slots", async (t) => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  t.after(() => {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  });
  const styles = [];
  let definition;
  globalThis.document = {
    querySelector: () => styles[0] ?? null,
    createElement: () => ({ dataset: {}, textContent: "", remove() { styles.splice(styles.indexOf(this), 1); } }),
    head: { appendChild: (node) => styles.push(node) },
  };
  globalThis.window = {
    __ModuleLoader__: {
      load: (value) => {
        definition = value;
      },
    },
  };

  await import(`../lib/client.js?smoke=${Date.now()}`);
  assert.equal(definition.id, "dsh-theme-shenhua");
  const plugin = definition.factory((id) => {
    if (id === "react/jsx-runtime") return jsxRuntime;
    throw new Error(`unexpected browser module: ${id}`);
  });
  assert.equal(styles.length, 0, "loading a disabled theme must not inject CSS");

  let paletteMounted = false;
  const effects = [];
  const slots = new Map();
  const slotDisposers = [];
  const ctx = {
    effect(thunk) {
      effects.push(thunk());
    },
    theme: {
      overrideTokens(source, tokens) {
        assert.equal(source, "dsh-theme-shenhua");
        assert.ok(Object.keys(tokens).length >= 60);
        paletteMounted = true;
        return () => {
          paletteMounted = false;
        };
      },
    },
    slots: {
      inject(_name, factory) {
        const disposer = factory();
        if (typeof disposer === "function") slotDisposers.push(disposer);
      },
      register(entry, component) {
        slots.set(entry.name, component);
        return () => slots.delete(entry.name);
      },
    },
  };

  plugin.apply(ctx);
  assert.equal(paletteMounted, true);
  assert.deepEqual([...slots.keys()].sort(), [
    "conversation.hero.brand.mark",
    "sidebar.brand.mark",
    "sidebar.brand.name",
  ]);
  assert.equal(styles.length, 1);
  assert.equal(styles[0].dataset.plugin, "dsh-theme-shenhua");

  for (const [name, Component] of slots) {
    const size = name.includes("hero") ? 34 : 24;
    const element = Component({ size, className: "host-mark" });
    assert.equal(typeof element, "object", `${name} should return a React element`);
    if (name.endsWith(".mark")) {
      const rendered = typeof element.type === "function" ? element.type(element.props) : element;
      assert.equal(rendered.props.style.width, size, "mark must fit the host slot");
      assert.ok(rendered.props.className.includes("host-mark"));
    }
  }

  const secondEffects = [];
  plugin.apply({ ...ctx, effect: thunk => secondEffects.push(thunk()), slots: { inject() {} } });
  assert.equal(styles.length, 1, "overlapping mounts share one style tag");
  for (const dispose of secondEffects.reverse()) dispose?.();
  assert.equal(styles.length, 1, "one instance must not remove another's styles");

  for (const dispose of effects) dispose?.();
  for (const dispose of slotDisposers) dispose?.();
  assert.equal(paletteMounted, false);
  assert.equal(slots.size, 0);
  assert.equal(styles.length, 0, "unload must restore host styles");
  for (const dispose of effects) dispose?.();
  plugin.apply(ctx);
  assert.equal(styles.length, 1, "theme can be re-enabled after unload");
  for (const dispose of effects) dispose?.();
  for (const dispose of slotDisposers) dispose?.();
  assert.equal(styles.length, 0);
});

test("profile patch replaces the official sidebar brand occupant", async () => {
  const patch = await readFile(new URL("../cordis.patch.yml", import.meta.url), "utf8");
  assert.match(patch, /id: ui-brand-official[\s\S]*disabled: true/);
  assert.match(patch, /id: dsh-theme-shenhua[\s\S]*name: "dsh-theme-shenhua"/);
});
