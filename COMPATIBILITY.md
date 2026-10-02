# 兼容性

| 插件版本 | 已验证的 DeepSeek Harness | 状态 |
| --- | --- | --- |
| 0.2.6 | 0.2.0-rc.2 | 深色模式改用独立的背景蒙版与更强的侧栏纹理；其余契约与 0.2.5 相同 |
| 0.2.5 | 0.2.0-rc.2 | 修复面板图标未被隐藏、与宿主图标并排显示的问题；其余契约与 0.2.4 相同 |
| 0.2.4 | 0.2.0-rc.2 | 面板行图标用 2026 客场球衣的豹纹斑覆盖 `sidebar.panellist` 插槽提供的图标；其余契约与 0.2.3 相同 |
| 0.2.3 | 0.2.0-rc.2 | 面板行图标换成豹爪印；其余契约与 0.2.2 相同 |
| 0.2.2 | 0.2.0-rc.2 | 面板行图标改用 `mask` 覆盖 `sidebar.panellist` 插槽提供的图标；其余契约与 0.2.1 相同 |
| 0.2.1 | 0.2.0-rc.2 | 修复「新建会话」快捷键提示（`Ctrl + N`）在品牌渐变按钮上的对比度，其余契约与 0.2.0 相同 |
| 0.2.0 | 0.2.0-rc.2 | 适配 Windows 桌面客户端（exe 安装版）与 CLI；支持 `desktop` profile 独立环境与模块化 `ui-workspace` |
| 0.1.2 | 0.1.5-rc.3 | 适配侧栏堆叠、主题清理、品牌组件尺寸与预览弹窗 |
| 0.1.0 | 0.1.5-rc.2 | 真实 Web 页面启动、浅色欢迎页、主题 token、队徽、球场照片与品牌插槽已验证 |
| 0.1.0 | 0.1.5-rc.1 | 构建、profile 挂载与浏览器 bundle 生命周期已验证 |

### 0.2.0 桌面安装版 (EXE) 适配说明

1. **Profile 隔离与桌面端运行环境（报错解释）**
   * **现象**：执行 `dsh plugin --profile desktop add ...` 提示 `error: profile "desktop" is managed exclusively by the Electron application`。
   * **根本原因**：外部独立的 `dsh` CLI（来自 npm 全局安装）默认禁止修改专供 Electron 桌面客户端内部使用的 `desktop` profile，以防并发文件写冲突损坏配置。
   * **解决方法**：
     * **方式 A（GUI 最推荐）**：在桌面客户端左侧栏打开「**插件 (Plugins)**」→ 点击右上角「**添加插件**」→ 输入本地路径或 tgz 路径即可安装启用。
     * **方式 B（桌面专用 CLI）**：使用桌面安装包内置的 `dsh.cmd`（携带 `manageDesktopProfile` 特权），例如：
       ```powershell
       & "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add ./dist/dsh-theme-shenhua-0.2.6.tgz
       ```

2. **工作区模块拆包兼容**
   * 在 Harness 0.2.0 中，工作区（`_projectRow`、`_sessionRow`、`_folder`）从 `ui-sidebar` 拆分为独立的 `@deepseek-ai/dsh-client-ui-workspace` 模块。
   * 本插件在 `package.json` 的 `dsh.client.inject` 中增加了该模块的声明，确保工作区和会话树在桌面端按正确依赖顺序加载并应用申花看台及体育场图标样式。

3. **核心插槽与官方品牌接管验证**
   * 0.2.0 桌面客户端依旧保留了三个核心品牌插槽：
     - `sidebar.brand.mark`
     - `sidebar.brand.name`
     - `conversation.hero.brand.mark`
   * `cordis.patch.yml` 中继续通过 `disabled: true` 停用官方默认的 `ui-brand-official`（`@deepseek-ai/dsh-client-ui-brand-official`），并以 `dsh-theme-shenhua` 无缝接管。
   * Cordis 依赖版本范围放宽至 `^4.0.0`，完全兼容 0.2.0 所内置的 `@deepseek-ai/cordis@~4.0.4`。

2026-09-23 修复说明：对照本机宿主 `settings-general` 的结构，设置弹窗是 `sidebar.settings` 下的 fixed 子节点；主题不能给侧栏根节点新增 stacking context。已移除原有侧栏及欢迎页 `isolation`，并用相同嵌套结构的预览弹窗做命中检测。品牌标记遵守宿主的 `size` / `className`，背景直接绘制在欢迎页表面；主题样式通过 `ctx.effect` 清理。四种视口的双模式检查见 `tests/layout.html`。当前运行中的实际 Harness 页面返回 HTTP 401，本次没有将预览回归记作真实实例验证。
