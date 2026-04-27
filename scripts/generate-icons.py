from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / 'build'
RESOURCES = ROOT / 'resources'
ICONS = BUILD / 'icons'


def rounded_rectangle(draw, xy, radius, fill):
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def create_icon(size: int) -> Image.Image:
    scale = size / 1024
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    def box(left, top, right, bottom):
        return tuple(round(value * scale) for value in (left, top, right, bottom))

    rounded_rectangle(draw, box(128, 112, 896, 912), round(210 * scale), (37, 99, 235, 255))
    rounded_rectangle(draw, box(128, 112, 896, 912), round(210 * scale), (14, 165, 233, 70))

    cloud = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cloud_draw = ImageDraw.Draw(cloud)
    cloud_draw.ellipse(box(218, 381, 454, 617), fill=(255, 255, 255, 245))
    cloud_draw.ellipse(box(323, 262, 647, 586), fill=(255, 255, 255, 245))
    cloud_draw.ellipse(box(544, 350, 806, 612), fill=(255, 255, 255, 245))
    cloud_draw.rounded_rectangle(box(275, 460, 705, 617), radius=round(78 * scale), fill=(255, 255, 255, 245))
    image.alpha_composite(cloud)

    draw.rounded_rectangle(box(310, 531, 714, 709), radius=round(36 * scale), fill=(224, 247, 255, 255))
    draw.ellipse(box(310, 450, 714, 612), fill=(255, 255, 255, 240), outline=(15, 117, 216, 255), width=max(6, round(34 * scale)))
    draw.arc(box(310, 539, 714, 701), 0, 180, fill=(56, 189, 248, 255), width=max(5, round(30 * scale)))
    draw.ellipse(box(426, 497, 598, 565), fill=(37, 99, 235, 32))
    draw.line(box(512, 347, 512, 434), fill=(37, 99, 235, 255), width=max(7, round(34 * scale)))
    draw.line(box(472, 394, 512, 434), fill=(37, 99, 235, 255), width=max(7, round(34 * scale)))
    draw.line(box(512, 434, 552, 394), fill=(37, 99, 235, 255), width=max(7, round(34 * scale)))

    return image


def save_pngs() -> None:
    for folder in (BUILD, RESOURCES, ICONS):
      folder.mkdir(parents=True, exist_ok=True)

    base = create_icon(1024)
    base.save(BUILD / 'icon.png')
    base.save(RESOURCES / 'icon.png')

    for size in (16, 24, 32, 48, 64, 128, 256, 512, 1024):
        resized = base.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(ICONS / f'icon-{size}.png')

    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base.save(BUILD / 'icon.ico', sizes=ico_sizes)
    base.save(BUILD / 'icon.icns')


if __name__ == '__main__':
    save_pngs()
    print('Generated build/icon.png, build/icon.ico, build/icon.icns and resources/icon.png')
