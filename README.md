# 申花 · 蓝血主场

一个为 DeepSeek Harness 制作的上海申花主题插件，提供「主场之夜」深色方案与「蓝白看台」浅色方案，包含申花队徽品牌、侧栏豹纹底纹与欢迎页球场背景。

沿用 Harness 原有的 **Light / Dark / System** 外观设置，安装后无需额外配置。不会修改模型、提示词、工具或会话数据。

## 预览

| 主场之夜 | 蓝白看台 |
| --- | --- |
| ![主场之夜深色预览](screenshots/shenhua-dark.png) | ![蓝白看台浅色预览](screenshots/shenhua-light.png) |

窄屏折叠状态见 [`screenshots/shenhua-narrow-dark.png`](screenshots/shenhua-narrow-dark.png)。

## 安装

要求 Node.js 22.19 或更高版本、pnpm，以及 DeepSeek Harness `0.1.5` / `0.2.0-rc`（支持 Windows 桌面安装包 EXE 及 CLI）。

> [!NOTE]
> **换了电脑（或刚拉下这个目录）时先构建一次。** 安装包和运行文件需要在本机生成：
>
> ```sh
> pnpm install     # 安装构建依赖（唯一需要联网的一步）
> pnpm build       # 生成运行文件
> pnpm pack:local  # 打包成 dist/dsh-theme-shenhua-<version>.tgz
> ```
>
> 之后按下面的方式把打包文件装进 Harness 即可。

> [!NOTE]
> **桌面客户端（exe 安装版）用户请注意**：
> 最新版 DeepSeek Harness 官方桌面安装包使用的是独立运行配置 **`desktop` profile**（位于 `~/.dsh/profiles/desktop/`），而非旧版命令行的 `web` profile。若此前安装过旧版插件，升级到 exe 后需安装至 `desktop` profile。

### 1. 最新桌面客户端（exe 安装包）

> [!IMPORTANT]
> **关于 `profile "desktop" is managed exclusively by the Electron application` 报错**：
> 官方为了保护桌面端配置，**禁止外部全局 `dsh` CLI 直接修改 `desktop` profile**。安装时请使用以下两种方法之一：

#### 方法 A：桌面端图形界面添加（推荐）
1. 打开 DeepSeek Harness 桌面客户端，点击左侧边栏的「**插件 (Plugins)**」图标；
2. 点击右上角的「**添加插件**」(Add Plugin) 按钮；
3. 输入打包文件或目录的绝对路径，例如：
   ```text
   C:\Users\xdani\Documents\dsh-shenhua-theme\dist\dsh-theme-shenhua-0.2.6.tgz
   ```
4. 点击确认安装，安装完成后点击「**立即启用**」(Enable Now) 即可实时生效。

#### 方法 B：使用桌面版内置的专属 CLI 执行
使用 Electron 安装目录内自带的 `dsh.cmd`（自带桌面 profile 管理权限）：

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add C:\Users\xdani\Documents\dsh-shenhua-theme\dist\dsh-theme-shenhua-0.2.6.tgz
```

### 2. Web Profile（命令行与无头环境）

针对传统 Web profile 环境：

```sh
# 安装打包产物
pnpm build
pnpm pack:local
dsh plugin --profile web add ./dist/dsh-theme-shenhua-0.2.6.tgz
dsh --profile web

# 或源码安装
dsh plugin --profile web add "link:$(pwd)"
dsh --profile web
```

打开 Harness 的 **Settings → General → Appearance**，选择 Light、Dark 或 System 即可在深浅色之间随心切换。

## 停用、卸载与升级

从桌面客户端卸载并恢复官方默认外观：

```sh
dsh plugin --profile desktop remove dsh-theme-shenhua
```

若使用的是 Web profile：

```sh
dsh plugin --profile web remove dsh-theme-shenhua
```

升级已安装的 tarball：

```sh
# 桌面版升级
dsh plugin --profile desktop update ./dist/dsh-theme-shenhua-0.2.6.tgz

# Web 版升级
dsh plugin --profile web update ./dist/dsh-theme-shenhua-0.2.6.tgz
```

## 开发

克隆仓库后，先安装依赖并构建：

```sh
pnpm install
pnpm build
pnpm check        # 类型检查 + 回归测试
pnpm release:check  # 完整发布前验证
```

本地预览：`pnpm build` 后用任意静态服务器打开 `preview/index.html`，右上角可切换深浅色，左上角可折叠侧栏。

## 设计说明

- 主色为申花蓝，红色为球衣点缀色；均为设计还原值，非俱乐部官方发布的标准色。
- 欢迎页背景采用申花主场照片，以柔和遮罩融入；照片来源见 `NOTICE.md`，运行时不请求任何外部图片或字体服务，离线环境可正常显示。
- 侧栏加入蓝白红细条、渐变主按钮与选中指示；
  - 「新建会话」按钮使用从申花队徽提取的侧面豹头；
  - 「工作区」使用八万人体育场剪影；
  - 「插件」等面板行使用申花 2026 赛季客场球衣的豹纹斑图案；
  - 侧栏背景加入低对比度豹纹底纹。
- 浅色方案采用雾蓝侧栏与白色输入卡；深色方案采用海军蓝分层，两种配色均沿用 Harness 原有的 Light / Dark / System 外观开关，无需额外配置。
- 安装后，Harness 官方侧栏品牌占位由申花队徽和字标接管；卸载主题后自动恢复官方品牌。

## 许可与球迷共建

自 v0.1.1 起，代码、CSS 和文档采用 **MPL-2.0**：对外分发受覆盖文件的修改时，需按协议提供对应源码。MPL 允许商业使用；不要求独立宿主或不含本项目代码的新文件整体开源。

原创球场、豹纹 SVG 采用 **CC BY-NC-SA 4.0**：署名、限非商业用途、分享改编作品时遵守相同方式共享条件。安装包附带源码、构建文件和完整协议。

队徽、队徽豹头、比赛照片及截图中的第三方权利不由本项目再授权，当前仓库也未提供其完整再分发授权证据。非官方声明、非商业用途或更换协议不能代替授权。

**旧版 v0.1.0 已授出的 MIT 权利仍有效**，包括旧版相同代码和原创图形；本次更改不追溯撤销这些权利。完整主题包含非商业和第三方素材，不应作为整体宣称可自由商用。

详见 [许可范围](LICENSING.md)、[MPL 正文](LICENSE)、[素材声明](NOTICE.md) 和 [贡献说明](CONTRIBUTING.md)。
