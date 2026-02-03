<div align="center">
  <img src="./images/icon.png" width="64" alt="Git Blame Gutter Icon">
  <h1>Git Blame Gutter</h1>
  <p>
    <strong>A visual and unobtrusive way to see Git blame information in VS Code.</strong>
  </p>
</div>

<br>

**Git Blame Gutter** displays Git blame information directly in the editor gutter. It helps you quickly identify who last modified a line and when, using a visual heat map to indicate the age of changes.

<div align="center">
  <img src="./images/screenshot.png" alt="Git Blame Gutter Screenshot" width="500">
</div>

## ✨ Features

- **Inline Blame Info**: Instantly see the commit date and author in the gutter.
- **Dynamic Heatmap**:
  - **Darker Blue**: Recent changes.
  - **Faded Blue**: Older changes.
- **Real-time Updates**: Blame info refreshes automatically on save or file switch.
- **Clean UI**: Unobtrusive design that keeps your code readable.
- **Toggleable**: Enable or disable with a simple command.

## 🚀 Installation

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view (`Cmd+Shift+X` or `Ctrl+Shift+X`).
3. Search for `Git Blame Gutter`.
4. Click **Install**.

Alternatively, launch VS Code Quick Open (`Cmd+P` or `Ctrl+P`), paste the following command, and press enter:

```bash
ext install amszuidas.git-blame-gutter
```

## 📖 Usage

The extension is **active by default** upon installation.

To toggle the gutter visibility:

1. Open the **Command Palette** (`Cmd+Shift+P` or `Ctrl+Shift+P`).
2. Run the command: `Git Blame Gutter: Toggle`.

## ⚙️ Requirements

- **Git**: Must be installed and available in your system's `PATH`.
- The open file must be part of a **Git repository**.

## 🔧 Settings

Currently, **Git Blame Gutter** is designed to be zero-config with an optimized fixed width and color scheme. Customization options may be added in future releases.

## 📝 Known Issues

- **Large Files**: Processing blame for very large files might have a slight delay.
- **Uncommitted Changes**: Lines with uncommitted changes are currently skipped to maintain clarity.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to report a bug, please open an issue or submit a pull request on [GitHub](https://github.com/amszuidas/git-blame-gutter).

## 📄 License

This project is licensed under the [MIT License](LICENSE.txt).

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/amszuidas">amszuidas</a></sub>
</div>
