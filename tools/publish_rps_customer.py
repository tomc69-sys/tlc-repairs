"""Copy the Remote Power preview onto the TLC site at /customer/RPS/."""
import shutil
from pathlib import Path

ROOT = Path(r"C:\Projects\TLC-Repairs")
SRC = ROOT / "work" / "remote-power"
DEST = ROOT / "customer" / "RPS"
PREFIX = "/customer/RPS"
SKIP_NAMES = {"start-preview.bat", "vawt-sprite.png"}
TEXT = {".html", ".css", ".js"}


def rewrite(text):
    text = text.replace(
        "Local preview for",
        "Preview for",
    )
    for quote in ('"', "'"):
        needle = f"{quote}/"
        repl = f"{quote}{PREFIX}/"
        # Leave the prefix itself alone if this file is republished.
        text = text.replace(repl, needle)
        text = text.replace(needle, repl)
    return text


def main():
    if DEST.exists():
        shutil.rmtree(DEST)
    count = 0
    for path in SRC.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(SRC)
        if rel.parts[0] == "_source" or path.name in SKIP_NAMES or path.name.startswith("_"):
            continue
        target = DEST / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix.lower() in TEXT:
            target.write_text(rewrite(path.read_text(encoding="utf-8")), encoding="utf-8")
        else:
            shutil.copy2(path, target)
        count += 1
    print(f"wrote {count} files to {DEST}")


if __name__ == "__main__":
    main()
