---
title: Dotfiles
company: Dotfiles
kind: personal
role: Maintainer
description: A terminal-first setup for macOS and Linux — Ghostty, Fish, Neovim, and tmux, with a status line that tracks AI coding agents.
seoTitle: 'Dotfiles – Ghostty, Fish, Neovim, and tmux Setup for macOS and Linux'
dateRange: 2021 - Present
sortDate: 2021-08-01
updated: 2026-11-12
location: Independent
order: 113
technologies: [Bash, Fish, Lua, Neovim, LazyVim, tmux, Ghostty, AeroSpace, Starship, Claude Code]
achievements:
  - '**Setup** — One re-runnable script for macOS and Linux package managers and configuration symlinks'
  - '**Agent status** — tmux-herd stores blocked, working, and finished states in pane options'
  - '**Daily tools** — Ghostty, Fish, Neovim, tmux, and small shell utilities'
  - '**Secrets** — On macOS, API keys load from the system Keychain'
externalUrl: https://github.com/peritissimus/dotfiles
---

My dotfiles have lived in one public repository since 2021. They hold the configuration for my shell, editor, terminal, and window manager, along with scripts for small tasks I repeat. Keeping them together makes it easier to set up another machine and carry changes between macOS and Linux.

## Working in the terminal

Ghostty is my main terminal, Fish is the shell, and Starship provides the prompt. I use zoxide to jump between directories and atuin to search shell history. Projects live in tmux windows, with saved layouts managed by tmuxinator.

Neovim runs on LazyVim, with language servers, debugging, and a database interface. Ctrl-h/j/k/l moves between editor splits and tmux panes. AeroSpace uses the same directions for macOS windows, and the repository includes an i3 configuration for Linux.

## Seeing which agent needs me

Running several coding agents at once made it hard to notice one waiting for input. [tmux-herd](https://github.com/peritissimus/dotfiles/tree/main/tmux/tmux-herd) adds counts of blocked, working, and finished agents to the status line. A picker lists blocked agents first.

Claude Code reports state through lifecycle hooks. For agents without hooks, tmux-herd infers state from pane titles. The state lives in tmux pane options, so it disappears with the pane and needs no separate daemon.

## Setting up another machine

`setup.sh` detects the operating system, installs tools through Homebrew, apt, dnf, or pacman, and symlinks the configurations into place. It also installs Rust and coding CLIs. The script works with macOS's Bash 3.2 and can be run again as the setup changes.

Small scripts handle recurring chores: `gcm` drafts a commit message from staged changes, `x` turns a plain-English request into a shell command, `q` answers questions about piped JSON, and `ywork` lists yesterday's commits across repositories. There is also a Bash version of [Kaze](/work/kaze).

The model-backed scripts send their input to the configured provider: a staged diff for `gcm`, a request for `x`, or piped data for `q`. Both `gcm` and `x` also support a local MLX server; `q` uses Groq.

The repository tracks Claude Code settings and hooks alongside the rest of the tools. On macOS, API keys are read from the system Keychain when the shell starts.
