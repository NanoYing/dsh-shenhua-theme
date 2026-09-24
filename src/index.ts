/** Public package metadata; the actual theme runs in the browser client entry. */
export const themeName = "申花 · 蓝血主场";
export const themeId = "dsh-theme-shenhua";
export { SHENHUA_TOKENS } from "./tokens.ts";

/** Host lifecycle entry; all visible behavior lives in the browser half. */
export function apply(): void {}
