# 兼容性

| 插件版本 | 已验证的 DeepSeek Harness | 状态 |
| --- | --- | --- |
| 0.1.0 | 0.1.5-rc.2 | 真实 Web 页面启动、浅色欢迎页、主题 token、队徽、球场照片与品牌插槽已验证 |
| 0.1.0 | 0.1.5-rc.1 | 构建、profile 挂载与浏览器 bundle 生命周期已验证 |

真实页面验证使用隔离的 `DSH_HOME` 和 Harness `0.1.5-rc.2` Web profile。主题包能够随 profile 持久加载，并在浏览器刷新后继续生效。插件补丁停用 `ui-brand-official` 这一默认占位，避免两个侧栏品牌组件竞争；移除插件后补丁层随之撤销。

DeepSeek Harness 目前处于开发者预览阶段，客户端插槽与主题 token 可能发生破坏性变化。升级 Harness 后请重新执行 `pnpm build && pnpm check`，并重点确认三个插槽仍存在：

- `sidebar.brand.mark`
- `sidebar.brand.name`
- `conversation.hero.brand.mark`

本轮视觉调整：侧栏覆盖通过 `data-slot` 限定范围，使用 0.1.5-rc.2 的 `_logoRow`、`_newSession`、`_projectRow`、`_folder` 等 CSS Module 类名后缀定位组件；不依赖构建哈希或界面语言。升级宿主时还需回归这些结构、工作区悬停展开箭头、选中会话和折叠栏。图标只替换装饰层，不接管按钮事件，也不替换运行状态图标。

当前预览复用实际浏览器 bundle，检查了深浅色、桌面与窄屏、侧栏折叠、输入框聚焦。当前正在运行的 Harness 页面需要认证，本轮未完成该实例的页面回归；上表是真实页面的历史验证记录。


2026-09-23 修复说明：对照本机宿主 `settings-general` 的结构，设置弹窗是 `sidebar.settings` 下的 fixed 子节点；主题不能给侧栏根节点新增 stacking context。已移除原有侧栏及欢迎页 `isolation`，并用相同嵌套结构的预览弹窗做命中检测。品牌标记遵守宿主的 `size` / `className`，背景直接绘制在欢迎页表面；主题样式通过 `ctx.effect` 清理。四种视口的双模式检查见 `tests/layout.html`。当前运行中的实际 Harness 页面返回 HTTP 401，本次没有将预览回归记作真实实例验证。
