// SPDX-License-Identifier: MPL-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { SHENHUA_TOKENS, apply } from "../lib/index.js";

const REQUIRED = [
  "--dsw-alias-bg-base",
  "--dsw-alias-bg-layer-1",
  "--dsw-alias-bg-layer-2",
  "--dsw-alias-bg-layer-3",
  "--dsw-alias-bg-overlay",
  "--dsw-alias-label-primary",
  "--dsw-alias-label-secondary",
  "--dsw-alias-label-tertiary",
  "--dsw-alias-brand-primary",
  "--dsw-alias-state-business-primary",
  "--dsw-alias-state-success-primary",
  "--dsw-alias-state-warn-primary",
  "--dsw-alias-state-error-primary",
  "--dsw-alias-border-l1",
  "--dsw-alias-border-l2",
  "--dsw-alias-interactive-bg-hover",
  "--dsw-alias-interactive-bg-active",
  "--dsw-alias-button-primary-fill",
  "--dsw-alias-button-primary-hover",
  "--dsw-alias-markdown-code-block",
  "--dsw-alias-markdown-code-block-banner",
  "--dsw-alias-markdown-inline-code",
  "--dsw-alias-markdown-tag",
  "--dsw-alias-scrollbar-bg-l1",
  "--dsw-alias-scrollbar-hover-l1",
  "--dsw-alias-tooltip-bg",
  "--dsw-specific-bubble",
  "--dsw-specific-bubble-highlight",
  "--dsw-specific-sidebar-fill",
  "--dsw-specific-sidebar-nav-item-active",
];

const SURFACES = [
  "--dsw-alias-bg-base",
  "--dsw-alias-bg-layer-1",
  "--dsw-alias-bg-layer-2",
  "--dsw-specific-bubble",
  "--dsw-alias-markdown-code-block",
  "--dsw-specific-sidebar-fill",
];

const LABEL_THRESHOLDS = new Map([
  ["--dsw-alias-label-primary", 4.5],
  ["--dsw-alias-label-secondary", 4.5],
  ["--dsw-alias-label-tertiary", 3],
  ["--dsw-alias-label-caption", 3],
  ["--dsw-alias-brand-primary", 3],
  ["--dsw-alias-state-business-primary", 3],
  ["--dsw-alias-state-success-primary", 3],
  ["--dsw-alias-state-warn-primary", 3],
  ["--dsw-alias-state-error-primary", 3],
]);

function rgb(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  assert.ok(match, `contrast test requires an opaque six-digit hex, got ${hex}`);
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(hex) {
  const channels = rgb(hex).map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

test("ships a paired value for every required Harness token", () => {
  assert.equal(typeof apply, "function", "host loader requires an apply entry");
  for (const token of REQUIRED) {
    assert.ok(token in SHENHUA_TOKENS, `missing ${token}`);
  }
  for (const [token, modes] of Object.entries(SHENHUA_TOKENS)) {
    assert.equal(typeof modes.light, "string", `${token}.light`);
    assert.equal(typeof modes.dark, "string", `${token}.dark`);
  }
});

test("body labels and semantic colors meet the documented contrast gates", () => {
  for (const mode of ["light", "dark"]) {
    for (const [foreground, threshold] of LABEL_THRESHOLDS) {
      for (const surface of SURFACES) {
        const ratio = contrast(
          SHENHUA_TOKENS[foreground][mode],
          SHENHUA_TOKENS[surface][mode],
        );
        assert.ok(
          ratio >= threshold,
          `${mode} ${foreground} on ${surface}: ${ratio.toFixed(2)} < ${threshold}`,
        );
      }
    }
  }
});

test("inverted tooltip text stays readable", () => {
  for (const mode of ["light", "dark"]) {
    const ratio = contrast(
      SHENHUA_TOKENS["--dsw-alias-label-primary-inverted"][mode],
      SHENHUA_TOKENS["--dsw-alias-tooltip-bg"][mode],
    );
    assert.ok(ratio >= 4.5, `${mode} tooltip contrast: ${ratio.toFixed(2)}`);
  }
});
