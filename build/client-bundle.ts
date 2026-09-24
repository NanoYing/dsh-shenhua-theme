import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { transform } from "lightningcss";
import type { TsdownPlugin, UserConfig } from "tsdown";

const PLATFORM_MODULES = [
  "react",
  "react/jsx-runtime",
  "react-dom",
  "react-dom/client",
  "@deepseek-ai/cordis",
  "@deepseek-ai/dsh-client-ui-slots",
] as const;

const HOST_MODULE = /^@deepseek-ai(?:\/|$)/;
const CSS_PREFIX = "\0shenhua-css:";
const SVG_PREFIX = "\0shenhua-svg:";
const JPEG_PREFIX = "\0shenhua-jpeg:";
const VIRTUAL_SUFFIX = ".mjs";

/** Build the host ESM face and the browser module-table bundle. */
export function clientBundle(
  id: string,
  libEntry: string,
  clientEntry: string,
): UserConfig[] {
  return [
    {
      name: id,
      entry: { index: libEntry },
      outDir: "lib",
      format: ["esm"],
      fixedExtension: false,
      dts: true,
      clean: false,
    },
    {
      name: `${id}/client`,
      entry: { client: clientEntry },
      outDir: "lib",
      format: "cjs",
      platform: "browser",
      clean: false,
      deps: {
        neverBundle: [HOST_MODULE, ...PLATFORM_MODULES],
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
      plugins: [cssPlugin(id), imagePlugin()],
      outputOptions: {
        entryFileNames: "client.js",
        banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
        footer: "return module.exports; } });",
        intro: "var module = { exports: {} }; var exports = module.exports;",
      },
    },
  ];
}

function absoluteVirtual(
  prefix: string,
  source: string,
  importer: string | undefined,
): string {
  const file = importer ? resolve(dirname(importer), source) : source;
  return `${prefix}${file}${VIRTUAL_SUFFIX}`;
}

function realFile(virtualId: string, prefix: string): string {
  return virtualId.slice(prefix.length, -VIRTUAL_SUFFIX.length);
}

/** Compile CSS Modules; mounting is owned by the plugin effect lifecycle. */
function cssPlugin(id: string): TsdownPlugin {
  return {
    name: "shenhua-css-modules-inline",
    resolveId(source, importer) {
      if (!source.endsWith(".module.css")) return null;
      return absoluteVirtual(CSS_PREFIX, source, importer);
    },
    async load(virtualId) {
      if (!virtualId.startsWith(CSS_PREFIX)) return null;
      const file = realFile(virtualId, CSS_PREFIX);
      if (!existsSync(file)) return null;
      this.addWatchFile(file);
      const source = (await readFile(file, "utf8")).replace(
        /url\(["']?(\.\.\/assets\/[^"')]+)["']?\)/g,
        (_match, path: string) => {
          const asset = resolve(dirname(file), path);
          this.addWatchFile(asset);
          const mime = asset.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
          return `url("data:${mime};base64,${readFileSync(asset).toString("base64")}")`;
        },
      );
      const result = transform({
        filename: file,
        code: Buffer.from(source),
        cssModules: { pattern: "[hash]_[local]" },
        minify: true,
      });
      const classMap: Record<string, string> = {};
      for (const [local, exported] of Object.entries(result.exports ?? {})) {
        classMap[local] = exported.name;
      }
      const css = result.code.toString();
      const tagId = `${id}/${file.split("/").pop()}`;
      return [
        `const css = ${JSON.stringify(css)};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        "export function mountStyles() {",
        "  if (typeof document === 'undefined') return () => {};",
        "  let tag = document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']');",
        "  if (!tag) {",
        "    tag = document.createElement('style');",
        `  tag.dataset.plugin = ${JSON.stringify(id)};`,
        "  tag.dataset.pluginCss = tagId;",
        "    document.head.appendChild(tag);",
        "  }",
        "  tag.textContent = css;",
        "  tag.dataset.themeUsers = String(Number(tag.dataset.themeUsers || 0) + 1);",
        "  let disposed = false;",
        "  return () => {",
        "    if (disposed) return;",
        "    disposed = true;",
        "    const remaining = Number(tag.dataset.themeUsers) - 1;",
        "    tag.dataset.themeUsers = String(remaining);",
        "    if (remaining === 0) tag.remove();",
        "  };",
        "}",
        `export default ${JSON.stringify(classMap)};`,
      ].join("\n");
    },
  };
}

/** Inline local imagery so the installed theme never fetches a remote asset. */
function imagePlugin(): TsdownPlugin {
  return {
    name: "shenhua-image-data-uri",
    resolveId(source, importer) {
      if (source.endsWith(".svg")) {
        return absoluteVirtual(SVG_PREFIX, source, importer);
      }
      if (source.endsWith(".jpg") || source.endsWith(".jpeg")) {
        return absoluteVirtual(JPEG_PREFIX, source, importer);
      }
      return null;
    },
    async load(virtualId) {
      const isSvg = virtualId.startsWith(SVG_PREFIX);
      const isJpeg = virtualId.startsWith(JPEG_PREFIX);
      if (!isSvg && !isJpeg) return null;
      const file = realFile(virtualId, isSvg ? SVG_PREFIX : JPEG_PREFIX);
      if (!existsSync(file)) return null;
      this.addWatchFile(file);
      const bytes = await readFile(file);
      const mime = isSvg ? "image/svg+xml" : "image/jpeg";
      const uri = `data:${mime};base64,${bytes.toString("base64")}`;
      return `export default ${JSON.stringify(uri)};`;
    },
  };
}
