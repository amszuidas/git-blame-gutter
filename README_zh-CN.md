<div align="center">
  <img src="./images/icon.png" width="64" alt="Git Blame Gutter Icon">
  <h1>Git Blame Gutter</h1>
  <p>
    <strong>一种在 VS Code 中直观且不干扰地查看 Git blame 信息的方式。</strong>
  </p>
</div>

<br>

**Git Blame Gutter** 直接在编辑器左侧槽（Gutter）中显示 Git blame 信息。它通过直观的热力图（根据修改时间显示不同深浅的颜色），帮助你快速识别每一行代码的最后修改者和修改时间。

<div align="center">
  <img src="./images/screenshot.png" alt="Git Blame Gutter 截图" width="500">
</div>

## ✨ 功能特性

- **行内 Blame 信息**：在侧边栏即时查看提交日期和作者。
- **动态热力图**：
  - **深蓝色**：近期修改。
  - **浅蓝色**：较早的修改。
- **实时更新**：在保存文件或切换文件时自动刷新 blame 信息。
- **整洁的 UI**：设计简洁，不干扰代码阅读。
- **可切换**：通过简单的命令即可启用或禁用。

## 🚀 安装

由于该扩展尚未发布到 VS Code 扩展市场，你可以通过源码进行安装：

1. **克隆仓库**（如果尚未克隆）：
   ```bash
   git clone https://github.com/amszuidas/git-blame-gutter.git
   cd git-blame-gutter
   ```

2. **安装依赖并编译**：
   ```bash
   npm install
   npm run compile
   ```

3. **打包扩展**：
   ```bash
   npx vsce package
   ```
   这将在项目根目录下生成一个 `.vsix` 文件（例如 `git-blame-gutter-0.0.1.vsix`）。

4. **安装 .vsix 文件**：
   - **命令行方式**：
     ```bash
     code --install-extension git-blame-gutter-0.0.1.vsix
     ```
   - **VS Code 界面方式**：
     1. 打开 **扩展** 视图（`Cmd+Shift+X` 或 `Ctrl+Shift+X`）。
     2. 点击右上角的 `...`（视图和更多操作）菜单。
     3. 选择 **从 VSIX 安装... (Install from VSIX...)**。
     4. 选择生成的 `.vsix` 文件。

## 📖 使用方法

安装后，扩展默认处于 **激活** 状态。

要切换侧边栏显示的可见性：

1. 打开 **命令面板**（`Cmd+Shift+P` 或 `Ctrl+Shift+P`）。
2. 运行命令：`Git Blame Gutter: Toggle`。

## ⚙️ 前置要求

- **Git**：必须已安装并添加到系统的 `PATH` 环境变量中。
- 打开的文件必须属于某个 **Git 仓库**。

## 🔧 设置

目前，**Git Blame Gutter** 设计为零配置，拥有优化过的固定宽度和配色方案。未来版本可能会添加自定义选项。

## 📝 已知问题

- **大文件**：处理非常大的文件的 blame 信息时可能会有轻微延迟。
- **未提交的更改**：为了保持清晰，包含未提交更改的行目前会被跳过。

## 🤝 贡献

欢迎提交贡献！如果你有建议或想报告 bug，请在 [GitHub](https://github.com/amszuidas/git-blame-gutter) 上提交 issue 或 pull request。

## 📄 许可证

本项目基于 [MIT License](LICENSE.txt) 许可。

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/amszuidas">amszuidas</a></sub>
</div>
