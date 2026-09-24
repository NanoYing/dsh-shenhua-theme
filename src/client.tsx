import crestUrl from "../assets/shenhua-crest.svg";
import styles, { mountStyles } from "./theme.module.css";
import { SHENHUA_TOKENS } from "./tokens.ts";

interface MarkProps {
  size: number;
  className?: string;
}

interface ClientContext {
  effect(thunk: () => unknown, label?: string): void;
  theme: {
    overrideTokens(source: string, tokens: typeof SHENHUA_TOKENS): () => void;
  };
  slots: {
    inject(name: string, factory: () => unknown): void;
    register(entry: { name: string }, component: unknown): unknown;
  };
}

export const inject = ["theme", "slots"] as const;

function Crest({ size, className }: MarkProps) {
  return (
    <span
      className={[styles.crestFrame, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
    >
      <img
        className={styles.crest}
        src={crestUrl}
        alt="上海申花足球俱乐部队徽"
        width={size}
        height={size}
      />
    </span>
  );
}

function SidebarMark({ size = 24, className }: MarkProps) {
  return <Crest size={size} className={className} />;
}

function SidebarName() {
  return (
    <span className={styles.wordmark} aria-label="上海申花 SHENHUA 1993">
      <strong>申花</strong>
      <span>SHENHUA · 1993</span>
    </span>
  );
}

function HeroMark({ size = 34, className }: MarkProps) {
  return <Crest size={size} className={className} />;
}

/** Mount palette and brand occupants; every registration is lifecycle-bound. */
export function apply(ctx: ClientContext): void {
  ctx.effect(mountStyles, "dsh-theme-shenhua: scoped styles");
  ctx.effect(
    () => ctx.theme.overrideTokens("dsh-theme-shenhua", SHENHUA_TOKENS),
    "dsh-theme-shenhua: paired palette",
  );

  ctx.slots.inject("sidebar.brand.mark", () =>
    ctx.slots.register({ name: "sidebar.brand.mark" }, SidebarMark),
  );
  ctx.slots.inject("sidebar.brand.name", () =>
    ctx.slots.register({ name: "sidebar.brand.name" }, SidebarName),
  );
  ctx.slots.inject("conversation.hero.brand.mark", () =>
    ctx.slots.register({ name: "conversation.hero.brand.mark" }, HeroMark),
  );
}
