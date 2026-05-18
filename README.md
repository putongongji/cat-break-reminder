# Cat Break Reminder

一个跨平台桌面休息提醒应用。默认每累计使用电脑 25 分钟，屏幕边缘会出现一只猫，慢慢走到屏幕中间，然后趴下休息，提醒你离开屏幕一会儿。

项目基于 Electron，支持 macOS 和 Windows。猫咪素材可以由用户自行导入，推荐使用透明背景 WebM，以获得接近原生动画的效果。

## 项目状态

当前项目处于可运行 MVP 阶段：

- macOS 本地开发和打包已验证
- Windows 打包配置已准备，但仍需要在 Windows 环境做实际烟测
- 尚未配置正式应用图标、代码签名、自动更新和发布流水线

## 核心特性

- 默认 25 分钟休息提醒
- 基于活跃使用时间累计，电脑空闲时暂停计时
- 全屏透明置顶提醒层
- 猫咪从屏幕右侧边缘滑入中间
- 到达中间后自动切换为趴下 / 休息素材
- 支持导入自定义走路素材和休息素材
- 支持 WebM、MP4、GIF、APNG、WebP、PNG、JPG 等素材格式
- 支持暂停、继续、重置和测试提醒
- 支持菜单栏 / 系统托盘后台运行
- 支持关闭窗口时隐藏到后台，或直接退出应用
- 支持开机启动和启动后后台运行
- 支持多显示器提醒覆盖

## 效果说明

应用的提醒层采用类似 Cat Gatekeeper 的交互模式：

```css
height: 100vh;
width: auto;
transform: translateX(100vw) -> translateX(0);
```

也就是说，猫咪素材本身不需要从画布里横向移动。素材只需要“原地走路”，应用会负责把整段素材从屏幕右侧移动到屏幕中间。

## 素材推荐

为了获得最佳效果，建议准备两份透明背景素材：

| 素材 | 用途 | 推荐格式 |
| --- | --- | --- |
| `walking.webm` | 猫从屏幕边缘走到中间时播放 | 透明 WebM，VP9 alpha，60fps，约 3 秒 |
| `resting.webm` | 猫到达中间后循环播放 | 透明 WebM，VP9 alpha，60fps，2-5 秒循环 |

素材制作建议：

- 背景必须透明，不要使用纯色背景
- 走路素材中猫应“原地走路”，不要在素材画布里横向移动
- 猫建议面向左，因为应用默认从右侧滑入
- 两份素材使用相同画布尺寸和猫的比例
- 推荐画布尺寸：`1440x1440` 或 `2160x2160`
- 不需要音频

详细规范见：[docs/ASSET_GUIDE.md](docs/ASSET_GUIDE.md)

## 安装与运行

环境要求：

- Node.js 22+
- npm 10+

安装依赖：

```bash
npm install
```

启动开发版：

```bash
npm start
```

如果已经有一个实例在运行，应用会复用单实例锁，新启动命令会提示：

```text
Another Cat Break Reminder instance is already running.
```

## 使用方式

1. 启动应用
2. 保持默认 25 分钟，或在设置中调整工作时长
3. 可选：导入自己的猫咪素材
4. 应用会在后台累计活跃使用时间
5. 到点后，全屏透明提醒层出现
6. 按 `Esc` 或点击 `Skip` 可提前关闭提醒

### 后台运行与退出

应用支持两种关闭行为：

- `Closing window keeps timer running` 开启：关闭窗口只是隐藏，计时器继续在菜单栏 / 托盘运行
- `Closing window keeps timer running` 关闭：关闭窗口会退出应用

你也可以通过以下入口完全退出：

- 应用窗口里的 `Quit`
- 菜单栏 / 系统托盘里的 `Quit Cat Break Reminder`
- 应用菜单里的 `Quit`

## 自定义猫咪素材

在应用设置区分别选择：

- `Walking cat`：猫走向屏幕中间时播放
- `Resting cat`：猫到达屏幕中间后播放

应用会把选中的素材复制到自己的 app data 目录，因此原始文件移动或删除后，不会影响已导入素材。

支持格式：

```text
WebM / MP4 / M4V / OGV / OGG / GIF / APNG / WebP / PNG / JPG / JPEG
```

注意：MP4 和 JPG 通常不支持透明背景。想要透明覆盖效果，优先使用 WebM、APNG、WebP 或 GIF。

## 常用命令

重新生成默认 GIF 素材：

```bash
npm run generate-assets
```

语法检查：

```bash
npm run check
```

运行单元测试：

```bash
npm test
```

完整验证：

```bash
npm run verify
```

打包当前平台应用目录：

```bash
npm run pack
```

生成安装包：

```bash
npm run dist
```

打包产物会输出到：

```text
dist/
```

## 项目结构

```text
cat-break-reminder/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ASSET_GUIDE.md
│   └── PRODUCT_AUDIT.md
├── scripts/
│   ├── check-syntax.js
│   └── generate-cat-gifs.js
├── src/
│   ├── assets/
│   ├── core/
│   ├── main/
│   ├── index.html
│   ├── main.js
│   ├── preload.js
│   ├── renderer.js
│   └── styles.css
└── test/
```

核心模块：

- `src/main.js`：Electron 生命周期、窗口、托盘、菜单和 IPC
- `src/main/cat-assets.js`：猫咪素材导入、复制和公开 URL
- `src/main/usage-store.js`：活跃使用时长持久化
- `src/core/active-usage-clock.js`：活跃计时逻辑
- `src/core/settings.js`：设置规范化和素材类型判断
- `src/renderer.js`：设置页和提醒层渲染逻辑

更多说明见：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 验证情况

当前已验证：

- `npm run verify`
- `npm run pack`
- macOS arm64 应用目录打包
- 15 个 Node 单元测试

尚需验证：

- Windows 真实机器安装和运行
- macOS 正式签名与 notarization
- 长时间后台运行稳定性
- 不同尺寸透明 WebM 素材的视觉效果

## 已知限制

- 默认图标仍是 Electron 图标
- 未配置自动更新
- 未配置正式发布流水线
- 未做 macOS 代码签名
- 未做 Windows 实机烟测
- 默认内置猫素材只是占位素材，最佳效果需要用户提供高质量透明 WebM

## 路线图

- 增加正式应用图标
- 增加首次启动引导
- 增加猫咪素材预览
- 增加素材缩放和入场方向设置
- 增加快捷键设置
- 增加自动更新
- 增加 GitHub Actions 打包流程
- 增加 Windows 安装包验证

## 许可证

当前项目代码使用 MIT License。

注意：用户导入的猫咪素材版权由素材提供方负责。请只使用你有权使用和分发的素材。
