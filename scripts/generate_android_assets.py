from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android" / "app" / "src" / "main" / "res"

INK = "#17372F"
CREAM = "#F7F1E7"
GOLD = "#F2B34D"
CORAL = "#E85D3F"


def draw_mark(image: Image.Image, inset: float = 0.2, include_background: bool = True, round_icon: bool = False) -> None:
    draw = ImageDraw.Draw(image)
    size = image.width
    if include_background:
        radius = size // 2 if round_icon else int(size * 0.23)
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=INK)

    left = size * (inset + 0.02)
    right = size * (1 - inset - 0.02)
    top = size * (inset + 0.08)
    bottom = size * (1 - inset + 0.03)
    mid = size / 2
    thickness = size * 0.12
    draw.polygon(
        [
            (left, top),
            (left + thickness, top),
            (mid, bottom - thickness),
            (right - thickness, top),
            (right, top),
            (mid, bottom),
        ],
        fill=GOLD,
    )
    dot_r = size * 0.055
    draw.ellipse((mid - dot_r, top - dot_r * 1.7, mid + dot_r, top + dot_r * 0.3), fill=CORAL)


def make_icons() -> None:
    densities = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    foreground_sizes = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
    for density, size in densities.items():
        folder = RES / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_mark(square)
        square.save(folder / "ic_launcher.png")

        rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_mark(rounded, round_icon=True)
        rounded.save(folder / "ic_launcher_round.png")

        foreground_size = foreground_sizes[density]
        foreground = Image.new("RGBA", (foreground_size, foreground_size), (0, 0, 0, 0))
        draw_mark(foreground, inset=0.28, include_background=False)
        foreground.save(folder / "ic_launcher_foreground.png")


def make_splash(path: Path) -> None:
    existing = Image.open(path)
    width, height = existing.size
    image = Image.new("RGB", (width, height), CREAM)
    mark_size = max(88, int(min(width, height) * 0.25))
    mark = Image.new("RGBA", (mark_size, mark_size), (0, 0, 0, 0))
    draw_mark(mark)
    image.paste(mark, ((width - mark_size) // 2, (height - mark_size) // 2), mark)
    image.save(path)


if __name__ == "__main__":
    make_icons()
    for splash in RES.glob("**/splash.png"):
        make_splash(splash)
    print("Generated Vernacular Android icons and splash screens.")
