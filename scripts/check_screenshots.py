#!/usr/bin/env python3
"""No capture that serves no purpose.

Every file in screenshots/ must be shown in the README, and every capture the README shows must
exist in screenshots/ or be one the screenshot scripts are about to render (a capture just added
to their list is committed by the Screenshots workflow after the first push, so it may not exist
yet). Run by pre-commit, locally and in CI.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "screenshots"
README = ROOT / "README.md"
REF = re.compile(r"screenshots/([\w.-]+\.(?:png|gif|jpe?g|webp|svg))", re.IGNORECASE)
SOURCES = ("scripts", "test", "tests", ".github")
TEXT = {".mjs", ".js", ".cjs", ".ts", ".py", ".json", ".yaml", ".yml", ".sh"}


def generator_text() -> str:
    """Source of the scripts that render the captures, where a capture still to render is named."""
    parts = []
    for name in SOURCES:
        base = ROOT / name
        if base.is_dir():
            parts.extend(p.read_text(errors="ignore") for p in base.rglob("*") if p.is_file() and p.suffix in TEXT)
    return "\n".join(parts)


def main() -> int:
    files = set()
    if SHOTS.is_dir():
        files = {p.name for p in SHOTS.iterdir() if p.is_file() and not p.name.startswith(".")}
    shown = set(REF.findall(README.read_text())) if README.is_file() else set()
    errors = [
        f"screenshots/{name}: not shown in README.md (show it, or stop rendering it and delete it)"
        for name in sorted(files - shown)
    ]
    missing = shown - files
    if missing:
        source = generator_text()
        for name in sorted(missing):
            stem = re.sub(r"-(dark|light)$", "", name.rsplit(".", 1)[0])
            if stem not in source:
                errors.append(f"README.md shows screenshots/{name}: no such file, no script renders it")
    for error in errors:
        print(error, file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
