/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';
import * as path from 'path';

/**
 * Interface representing Git blame information for a specific commit.
 */
export interface BlameInfo {
    hash: string;
    author: string;
    time: number;
    summary?: string;
}

/**
 * Interface representing a line of blame information.
 */
interface BlameLine {
    line: number;
    info: BlameInfo;
}

// Configuration constants
const DEBOUNCE_DELAY_MS = 150;
const STATUS_BAR_DURATION_MS = 2000;
const GUTTER_WIDTH_CHARS = 18;
const DECORATION_STYLES = {
    before: {
        margin: '0 15px 0 0',
        fontStyle: 'normal',
        fontWeight: 'normal',
        textDecoration: `none; display: inline-block; width: ${GUTTER_WIDTH_CHARS}ch; text-align: left; padding-left: 1ch; user-select: none;`
    },
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
};

/**
 * Activates the extension.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    const blameGutter = new GitBlameGutter();

    context.subscriptions.push(
        vscode.commands.registerCommand('git-blame-gutter.toggle', () => {
            blameGutter.toggle();
        }),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                blameGutter.update(editor);
            }
        }),
        vscode.workspace.onDidSaveTextDocument(document => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document) {
                blameGutter.update(editor);
            }
        }),
        vscode.workspace.onDidChangeTextDocument(e => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === e.document) {
                blameGutter.update(editor);
            }
        }),
        vscode.window.onDidChangeActiveColorTheme(() => {
            blameGutter.updateTheme();
            if (vscode.window.activeTextEditor) {
                blameGutter.update(vscode.window.activeTextEditor);
            }
        }),
        blameGutter
    );

    if (vscode.window.activeTextEditor) {
        blameGutter.update(vscode.window.activeTextEditor);
    }
}

/**
 * Controller class for managing the Git Blame Gutter decorations.
 */
class GitBlameGutter {
    private baseDecorationType: vscode.TextEditorDecorationType;
    private enabled: boolean = true;
    private updateTimeout: NodeJS.Timeout | undefined;
    private blameCache: Map<string, BlameLine[]> = new Map();
    private isDarkTheme: boolean = false;

    constructor() {
        this.baseDecorationType = vscode.window.createTextEditorDecorationType(DECORATION_STYLES);
        this.updateTheme();
    }

    /**
     * Updates the internal theme state based on the current VS Code theme.
     */
    public updateTheme() {
        const kind = vscode.window.activeColorTheme.kind;
        this.isDarkTheme = kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
    }

    /**
     * Toggles the enabled state of the extension.
     */
    public toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            if (vscode.window.activeTextEditor) {
                this.update(vscode.window.activeTextEditor);
            }
        } else {
            this.clearDecorations();
        }
        vscode.window.setStatusBarMessage(`Git Blame Gutter: ${this.enabled ? 'Enabled' : 'Disabled'}`, STATUS_BAR_DURATION_MS);
    }

    /**
     * Schedules an update of the blame decorations for the given editor.
     * Uses a debounce timer to avoid excessive git calls.
     * @param editor The text editor to update.
     */
    public update(editor: vscode.TextEditor) {
        if (!this.enabled) return;
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.doUpdate(editor);
        }, DEBOUNCE_DELAY_MS);
    }

    /**
     * Performs the actual update of the decorations.
     * @param editor The text editor to update.
     */
    private async doUpdate(editor: vscode.TextEditor) {
        const doc = editor.document;
        if (doc.isUntitled || doc.uri.scheme !== 'file') return;

        const currentVersion = doc.version;

        try {
            const content = doc.getText();
            const blameLines = await this.getBlameInfo(doc.uri.fsPath, content);
            
            // If the document has changed since we started, discard the results to avoid race conditions
            if (editor.document.version !== currentVersion) {
                return;
            }

            this.blameCache.set(doc.uri.fsPath, blameLines);
            this.applyDecorations(editor, blameLines);
        } catch (error) {
            // Probably not a git repo or git not installed
            // We can optionally log this error or show a warning, but for now we just clear decorations
            this.blameCache.delete(doc.uri.fsPath);
            this.applyDecorations(editor, []);
        }
    }

    /**
     * Retrieves git blame information for the specified file and content.
     * @param filePath The path to the file on disk.
     * @param content The current content of the buffer (to handle unsaved changes).
     * @returns A promise resolving to an array of blame lines.
     */
    private getBlameInfo(filePath: string, content: string): Promise<BlameLine[]> {
        return new Promise((resolve, reject) => {
            const cwd = path.dirname(filePath);
            const fileName = path.basename(filePath);

            // Use --contents - to blame the current buffer content instead of the file on disk
            // This allows us to show blame for unsaved changes (which will appear as "Not Committed Yet" or 0000 hash)
            const child = exec(`git blame --incremental --contents - "${fileName}"`, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
                if (error) {
                    reject(error);
                    return;
                }

                const lines = stdout.split('\n');
                const blameMap: Map<string, BlameInfo> = new Map();
                const result: BlameLine[] = [];
                
                let currentHash = '';
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line) continue;

                    const parts = line.split(' ');
                    const hash = parts[0];

                    if (/^[0-9a-f]{40}$/.test(hash)) {
                        currentHash = hash;
                        const lineNum = parseInt(parts[2]);
                        const count = parseInt(parts[3]);

                        if (!blameMap.has(hash)) {
                            blameMap.set(hash, { hash, author: '', time: 0 });
                        }
                        
                        // Collect lines for this hash
                        // Ignore uncommitted changes (00000... hash) if we want to mimic standard behavior,
                        // but sometimes it's useful to see them. Current logic ignores them.
                        if (hash !== '0000000000000000000000000000000000000000') {
                            for (let j = 0; j < count; j++) {
                                result.push({ line: lineNum + j, info: blameMap.get(hash)! });
                            }
                        }
                        continue;
                    }

                    const info = blameMap.get(currentHash);
                    if (!info) continue;

                    if (line.startsWith('author ')) {
                        info.author = line.substring(7).trim();
                    } else if (line.startsWith('author-time ')) {
                        info.time = parseInt(line.substring(12).trim());
                    } else if (line.startsWith('summary ')) {
                        info.summary = line.substring(8).trim();
                    }
                }
                resolve(result);
            });

            if (child.stdin) {
                child.stdin.write(content);
                child.stdin.end();
            }
        });
    }

    /**
     * Applies the blame decorations to the editor.
     * @param editor The text editor to decorate.
     * @param blameLines The blame information to display.
     */
    private applyDecorations(editor: vscode.TextEditor, blameLines: BlameLine[]) {
        const doc = editor.document;
        
        // Find the range of ages in the current file for better color distribution
        let minTime = Infinity;
        let maxTime = -Infinity;
        
        blameLines.forEach(l => {
            if (l.info.time < minTime) minTime = l.info.time;
            if (l.info.time > maxTime) maxTime = l.info.time;
        });

        const decorations: vscode.DecorationOptions[] = [];
        const lineToBlame = new Map<number, BlameInfo>();
        blameLines.forEach(l => lineToBlame.set(l.line - 1, l.info));

        for (let i = 0; i < doc.lineCount; i++) {
            const info = lineToBlame.get(i);
            const range = new vscode.Range(i, 0, i, 0);
            
            if (info && info.time > 0) {
                const date = new Date(info.time * 1000);
                const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
                
                let author = info.author || 'Unknown';
                if (author.length > 6) {
                    author = author.substring(0, 6);
                } else {
                    author = author.padEnd(6, ' ');
                }

                const text = `${dateStr} ${author}`;
                
                let ratio = 0;
                if (maxTime !== minTime && minTime !== Infinity) {
                    ratio = (maxTime - info.time) / (maxTime - minTime);
                }
                const color = this.getColorFromRatio(ratio);
                const textColor = this.isDarkTheme ? '#cccccc' : '#555555';

                decorations.push({
                    range,
                    renderOptions: {
                        before: {
                            contentText: text,
                            backgroundColor: color,
                            color: textColor
                        }
                    }
                });
            } else {
                // For lines without blame info, show an empty placeholder to maintain the "column"
                decorations.push({
                    range,
                    renderOptions: {
                        before: {
                            contentText: '\u00A0'.repeat(GUTTER_WIDTH_CHARS),
                            backgroundColor: 'transparent'
                        }
                    }
                });
            }
        }

        editor.setDecorations(this.baseDecorationType, decorations);
    }

    /**
     * Calculates a color based on the age ratio of the commit.
     * @param ratio A number between 0 (newest) and 1 (oldest).
     * @returns An HSL color string.
     */
    private getColorFromRatio(ratio: number): string {
        const h = 210;
        let s: number;
        let l: number;

        if (this.isDarkTheme) {
            // Dark Mode
            // Newest (0) -> hsl(210, 50%, 30%) - Visible Blue
            // Oldest (1) -> hsl(210, 10%, 15%) - Dark Grey-Blue
            s = Math.round(50 - (ratio * 40)); // 50% -> 10%
            l = Math.round(30 - (ratio * 15)); // 30% -> 15%
        } else {
            // Light Mode (GoLand-like soft blue palette)
            // Newest (0) -> hsl(210, 50%, 85%) - Soft Blue
            // Oldest (1) -> hsl(210, 10%, 96%) - Very Light Grey-Blue
            s = Math.round(50 - (ratio * 40)); // 50% -> 10%
            l = Math.round(85 + (ratio * 11)); // 85% -> 96%
        }
        
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    /**
     * Clears all decorations from all visible editors.
     */
    private clearDecorations() {
        const editors = vscode.window.visibleTextEditors;
        editors.forEach(editor => {
            editor.setDecorations(this.baseDecorationType, []);
        });
    }

    /**
     * Disposes of the resources used by the controller.
     */
    public dispose() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.baseDecorationType.dispose();
    }
}

/**
 * Deactivates the extension.
 */
export function deactivate() {}

