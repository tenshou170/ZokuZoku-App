<img align="left" width="80" height="80" src="src-tauri/icons/icon.png">

# ZokuZoku App

A standalone app for translating UM:PD using Hachimi's translation framework.


![Release](https://github.com/tenshou170/ZokuZoku-App/actions/workflows/release.yml/badge.svg)

> [!NOTE]
> This project is a standalone port of the VS Code extension that does not require VS Code. It uses Tauri for the backend and SvelteKit for the frontend.

## Features

- **Story Explorer**: Browse and read main, event, and character story timelines
- **Race Stories Explorer**: View race scripts and metadata
- **Lyrics Explorer**: View song lyrics extracted from game assets
- **MDB Editor**: View and search master database text entries
- **Localize Dict**: View translation dictionary entries
- **Audio Support**: Listen to voice lines (requires `wannacri` and `ffmpeg`)
- **Dynamic Configuration**: Easily point to your game data and translation folders

## Installation

### Download

Get the latest direct binaries for Windows, macOS, or Linux from [Releases](https://github.com/tenshou170/ZokuZoku-App/releases).

### Development Setup

If you want to run the app from source:

1. **Clone the repository**
   ```bash
   git clone https://github.com/tenshou170/ZokuZoku-App.git
   cd ZokuZoku-App
   ```

2. **Install Frontend dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Python Virtual Environment**
   ```bash
   python3 -m venv .venv
   
   # Linux/macOS
   source .venv/bin/activate
   pip install -r python/requirements.txt
   
   # Windows
   .venv\Scripts\activate
   pip install -r python/requirements.txt
   ```

4. **Run the App**
   ```bash
   pnpm tauri dev
   ```

## Prerequisites

### System Requirements

- **Rust**: [1.92.0+](https://www.rust-lang.org/tools/install) (Current-stable as of Dec 2025)
- **Node.js**: 20+ (LTS recommended)
- **pnpm**: Latest
- **Python**: 3.13
- **FFmpeg**: Required for audio extraction (`wannacri`)
  - Linux: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Windows: Download binaries and add to PATH

### UM:PD Game Files

- DMM or Steam installation (JP version)
- Game data downloaded (usually in `AppData/LocalLow/Cygames/umamusume`)

## Usage

### First-Time Setup

1. **Launch the app** via `pnpm tauri dev` or the executable.
2. **Open Settings**: Expand the **SETTINGS** section in the bottom-left sidebar.
3. **Select Game Data**: Click **Select Game Data** and point it to your Umamusume installation folder (where `dat`, `meta`, and `master` folders are located).
4. **Select Tran. Path**: Click **Select Tran. Path** and point it to any folder containing your `localize_dump.json`.

### Exploring Assets

- **Stories Explorer**: Expand categories like *Main Story* to see individual stories. Click one to open the editor.
- **Audio**: When viewing a story, voice lines will be extracted and made available for playback automatically.
- **Tools**: Use the **MDB EDITORS** or **LYRICS EXPLORER** to view other game data.

## Development

The project structure is as follows:
- `src-tauri/`: Rust backend (Tauri)
- `src/`: SvelteKit frontend
- `python/`: Python sidecars for Unity asset processing

```bash
pnpm tauri build
```

## Acknowledgement

- [ZokuZoku-Edge](https://github.com/thshafi170/ZokuZoku-Edge) - Original Base Repository
- [Mario0051/ZokuZoku](https://github.com/Mario0051/ZokuZoku) - Active Upstream for VS Code extension
- [Tauri](https://tauri.app/) - Desktop App Framework
- [Svelte](https://svelte.dev/) - Frontend Framework

## License
[GNU GPLv3](LICENSE)
