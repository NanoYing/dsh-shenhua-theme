// SPDX-License-Identifier: MPL-2.0
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

/**
 * The "Ctrl + N" hint sits on the brand gradient, but Harness paints its keycaps
 * with --dsw-alias-label-tertiary, which is picked for the host's own white
 * button and drops to ~1.3:1 on the navy fill. Guard the restated foreground.
 */
test("new-session shortcut hint stays legible on the brand gradient", async () => {
  const bundle = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");
  const rule = /\[class\*=_newSessionShortcut\]\{([^}]*)\}/.exec(bundle);
  assert.ok(rule, "the theme must restate the shortcut hint foreground");
  const declared = /color:(#[0-9a-f]{6}(?:[0-9a-f]{2})?)/i.exec(rule[1]);
  assert.ok(declared, `the hint rule needs an explicit colour: ${rule[1]}`);

  const channels = (hex) => [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const luminance = (hex) =>
    channels(hex).reduce((total, value, index) => {
      const normalized = value / 255;
      const linear = normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      return total + [0.2126, 0.7152, 0.0722][index] * linear;
    }, 0);
  const [r, g, b] = channels(declared[1].slice(1, 7));
  const alpha = declared[1].length === 9 ? Number.parseInt(declared[1].slice(7), 16) / 255 : 1;
  // Composite the hint over the brightest gradient stop (#005bac): worst case.
  const fill = [0, 0x5b, 0xac];
  const blended = [r, g, b]
    .map((value, index) => Math.round(value * alpha + fill[index] * (1 - alpha)).toString(16).padStart(2, "0"))
    .join("");
  const [lighter, darker] = [luminance(blended), luminance("005bac")].sort((x, y) => y - x);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  assert.ok(ratio >= 4.5, `hint on brand fill: ${ratio.toFixed(2)} < 4.5`);
});

/**
 * Panel glyphs are owned by the sidebar.panellist slot, so the theme can only
 * swap them by masking the occupant out. Guard the rule, the inline artwork and
 * the rail size the sidebar asks occupants for (18px).
 */
test("panel glyphs are swapped for the inline leopard-spot mark", async () => {
  const bundle = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");
  assert.match(
    bundle,
    /--shenhua-panel:url\(data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+\)/,
    "the spot artwork must ship inline with the bundle",
  );
  assert.match(
    bundle,
    /\[class\*=_panelGlyph\] svg\{display:none\}/,
    "the occupant glyph must be hidden through a descendant selector",
  );
  assert.doesNotMatch(
    bundle,
    /\[class\*=_panelGlyph\]\s*>svg\{display:none\}/,
    "slot outlets nest div[data-slot], so a child combinator misses the occupant icon",
  );
  assert.match(
    bundle,
    /\[class\*=_panelGlyph\][^{]*\{[^}]*mask:var\(--shenhua-panel\)/,
    "the replacement mark must be painted through the asset variable",
  );
  assert.match(
    bundle,
    /\[class\*=_collapsed\][^{]*\[class\*=_panelGlyph\][^{]*\{[^}]*width:18px/,
    "the rail renders panel glyphs at 18px",
  );
});

/**
 * The preview has to reproduce the host's slot outlet: renderSlot wraps its
 * occupant in div[data-slot][style="display:contents"], and a preview that skips
 * that wrapper hides exactly the bug this rule keeps hitting.
 */
test("preview mirrors the slot outlet wrapping panel glyphs", async () => {
  const html = await readFile(new URL("../preview/index.html", import.meta.url), "utf8");
  assert.match(
    html,
    /panelGlyph[^>]*>\s*<div data-slot="sidebar\.panellist"[^>]*display:contents/,
    "the preview panel row must nest its glyph in a slot outlet",
  );
});

/**
 * A near-white veil over the match photo reads fine; the same opacity over the
 * night palette flattens the photo into a dark panel and the theme looks like it
 * shipped no background at all. Guard the looser dark veil and the doubled spot
 * texture that keep the night palette visibly branded.
 */
test("dark mode keeps the branded backdrop visible", async () => {
  const bundle = await readFile(new URL("../lib/client.js", import.meta.url), "utf8");
  const darkHero = /body\[data-ds-dark-theme\][^{]*\[data-phase="?hero"?[^{]*\{([^}]*)\}/.exec(bundle);
  assert.ok(darkHero, "dark mode needs its own welcome backdrop rule");
  const stops = [...darkHero[1].matchAll(/--dsw-alias-bg-base\)\s+(\d+)%/g)].map((match) => Number(match[1]));
  assert.ok(stops.length >= 2, `expected two veil stops, got ${stops.join()}`);
  assert.ok(Math.max(...stops) < 90, `a near-opaque dark veil erases the photo: ${stops.join()}`);

  const darkSidebar = /body\[data-ds-dark-theme\][^{]*\[class\*=_root\][^{]*\{([^}]*)\}/.exec(bundle);
  assert.ok(darkSidebar, "dark mode needs its own sidebar backdrop rule");
  assert.equal(
    (darkSidebar[1].match(/url\(data:image\/svg\+xml/g) ?? []).length,
    2,
    "the spot texture must be layered twice to survive the dark fill",
  );
});
