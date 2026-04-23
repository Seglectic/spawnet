# AGENTS

## Project Shape

- `spawn.py` is both the local dev server and the build tool.
- `client/` contains the browser app and is bundled recursively during builds.
- `bin/` is generated output and should not be edited by hand.

## Working Norms

- Keep the server dependency-free and in the Python standard library when possible.
- Preserve the ability to run `python3 spawn.py` for local development.
- Keep `uv sync` sufficient for installing any non-stdlib build dependency.
- Preserve the ability to build self-contained artifacts from `spawn.py build`.
- Avoid hardcoding specific asset filenames in the bundling path; package the full `client/` tree.

## Packaging Guidance

- `py` and `pyz` builds should work cross-platform anywhere Python 3 is available.
- `exe` builds rely on PyInstaller and are best produced on Windows.
- Default build outputs belong under `bin/`.
