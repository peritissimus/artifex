---
title: Dotfiles
company: Dotfiles
kind: personal
role: Maintainer
description: A terminal-first setup for macOS and Linux — Ghostty, Fish, Neovim, and tmux, with a status line that tracks AI coding agents.
seoTitle: 'Dotfiles – Ghostty, Fish, Neovim, and tmux Setup for macOS and Linux'
dateRange: 2021 - Present
sortDate: 2021-08-01
updated: 2026-08-07
location: Independent
order: 113
technologies: [Bash, Fish, Lua, Neovim, LazyVim, tmux, Ghostty, AeroSpace, Starship, Claude Code]
achievements:
  - '**One script, two operating systems** — setup.sh installs 45 command-line tools through Homebrew, apt, dnf, or pacman with per-distro package names, then symlinks every config into place; it is safe to re-run'
  - '**Agent-aware tmux** — tmux-herd counts AI coding agents that are blocked, working, or done right in the status line, with state kept in tmux pane options instead of files or a daemon'
  - '**An editor that steps aside** — Neovim on LazyVim with LSP, debugging, a database UI, and the same Ctrl-h/j/k/l moves across editor splits and tmux panes'
  - "**Small tools for daily friction** — Shell scripts for LLM-written commit messages, natural-language shell commands, quick jq queries, line counts, and yesterday's commits"
  - '**No secrets in the repo** — API keys are read from the macOS Keychain when the shell starts'
externalUrl: https://github.com/peritissimus/dotfiles
outcome: 'A new machine becomes my machine with one script, and the setup has kept pace with how I work — from a Bash prompt and a Vim config in 2021 to a terminal that keeps track of several AI agents at once.'
---

Dotfiles are the configuration files that shape a developer's tools: the shell, the editor, the terminal, the window manager. Mine have lived in one public repository since 2021, through more than 300 commits. Each change is a small decision about how work should feel.

**The terminal is the workspace.** Ghostty is the main terminal, with a translucent dark theme, FiraCode, and a drop-down quick terminal on Cmd+\`. Cmd+1 through Cmd+9 switch tmux windows instead of terminal tabs, so one window holds every project. Fish is the shell, with vi key bindings, Starship for the prompt, zoxide for jumping between directories, and atuin for searchable history. Alacritty, WezTerm, and iTerm2 configurations stay in the repository as alternates.

**One keyboard model everywhere.** Neovim runs on LazyVim with a transparent Tokyo Night theme, language servers for TypeScript, Rust, Swift, and JSON, nvim-dap for debugging, and vim-dadbod-ui for databases. Navigator.nvim makes Ctrl-h/j/k/l move between editor splits and tmux panes as if they were one surface. tmux uses Ctrl-a as its prefix, vi copy mode, and session restore, with tmuxinator layouts for each project. AeroSpace tiles windows on macOS with the same h/j/k/l keys, and an i3 configuration covers Linux.

**A status line for agents.** Running several AI coding agents in parallel raised a new question: which one is waiting on me? [tmux-herd](https://github.com/peritissimus/dotfiles/tree/main/tmux/tmux-herd) answers it in the status line I already watch, as colored counts of agents that are blocked, working, or done. Claude Code reports its state through lifecycle hooks; for agents without hooks, the state is inferred from the pane title. Prefix+g opens a picker that lists blocked agents first. State lives in tmux pane options, so there is no daemon and nothing to clean up when a pane closes.

**Setup is one script.** `setup.sh` detects the operating system and installs the toolchain through Homebrew, apt, dnf, or pacman, mapping each package to its name on that system. It sets Fish as the default shell, installs Rust and the Claude Code, Codex, and Gemini command-line tools, and symlinks each configuration into place. It stays compatible with the Bash 3.2 that ships with macOS and can be re-run at any time.

**Scripts for small, repeated chores.** The `scripts` folder holds the tools I reach for daily. `gcm` writes a commit message from the staged diff using a local MLX model, Groq, or OpenAI. `x` turns a plain-English request into a shell command. `q` answers quick questions or writes the jq filter for piped JSON. `sloc` counts lines of code by language and respects `.gitignore`, and `ywork` lists yesterday's commits across repositories. There is also a Bash version of [Kaze](/work/kaze), my natural-language code search tool.

**Configuration for an AI pair.** The repository also tracks Claude Code settings: a status line that shows how much of the context window is in use, lifecycle hooks, and a skill for writing production-grade Bash. API keys never touch the repository. The shell reads them from the macOS Keychain when it starts.
