#!/usr/bin/env python3
"""GRM app icon PNG generator — Sierra Leone flag bands + speech bubble.

Source: the master SVG at assets/images/icon.svg and the spec in
`App Icon.html` (Option A · Flag bands + voice). Renders with PIL at 4×
and LANCZOS-downscales for smooth curves (PIL drawing is aliased).

Run:
    python3 scripts/gen_icons.py

Outputs (all under assets/images/):
    icon.png              full master, 1024×1024, flag + bubble + dots
    adaptive-icon.png     Android adaptive foreground (bubble + dots, transparent)
    adaptive-bg.png       Android adaptive background (flag bands)
    adaptive-mono.png     Android themed monochrome (bubble, dots cut out)
    notification-icon.png Android notification tray (96×96, tinted white)
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'images'
SCALE = 4  # render @ 4× then downscale for smoothness

GREEN = '#1EB53A'
WHITE = '#FFFFFF'
BLUE = '#0072C6'
DOT = '#005BA2'


def render_1024(draw_fn, filename, bg=None, tile_size=1024):
    s = tile_size * SCALE
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0) if bg is None else bg)
    draw = ImageDraw.Draw(img)
    draw_fn(draw, s)
    out = img.resize((tile_size, tile_size), Image.Resampling.LANCZOS)
    out.save(OUT / filename, 'PNG')


def draw_bands(d, s):
    d.rectangle([0, 0, s, 348 * SCALE], fill=GREEN)
    d.rectangle([0, 348 * SCALE, s, 676 * SCALE], fill=WHITE)
    d.rectangle([0, 676 * SCALE, s, 1024 * SCALE], fill=BLUE)


def draw_bubble(d, s, fill=WHITE, dots_fill=DOT):
    cx, cy = 512 * SCALE, 512 * SCALE
    r = 225 * SCALE
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)
    d.polygon(
        [
            (450 * SCALE, 716 * SCALE),
            (350 * SCALE, 800 * SCALE),
            (390 * SCALE, 690 * SCALE),
        ],
        fill=fill,
    )
    if dots_fill:
        dr = 22 * SCALE
        for dx in (430, 512, 594):
            dcx = dx * SCALE
            d.ellipse([dcx - dr, cy - dr, dcx + dr, cy + dr], fill=dots_fill)


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    render_1024(lambda d, s: (draw_bands(d, s), draw_bubble(d, s))[0],
                'icon.png', bg=(255, 255, 255, 255))
    render_1024(lambda d, s: draw_bubble(d, s), 'adaptive-icon.png')
    render_1024(lambda d, s: draw_bands(d, s),
                'adaptive-bg.png', bg=(255, 255, 255, 255))

    # Monochrome: bubble filled white, dots cut out (transparent) so
    # Material You's themed tint renders through.
    s = 1024 * SCALE
    mono = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    md = ImageDraw.Draw(mono)
    draw_bubble(md, s, fill=WHITE, dots_fill=None)
    cy = 512 * SCALE
    dr = 22 * SCALE
    for dx in (430, 512, 594):
        dcx = dx * SCALE
        md.ellipse([dcx - dr, cy - dr, dcx + dr, cy + dr], fill=(0, 0, 0, 0))
    mono.resize((1024, 1024), Image.Resampling.LANCZOS).save(
        OUT / 'adaptive-mono.png', 'PNG',
    )

    # Notification icon: 96×96 white silhouette, dots cut out.
    ns = 96 * SCALE
    ratio = 96 / 1024

    def scaled(v):
        return v * ratio * SCALE

    notif = Image.new('RGBA', (ns, ns), (0, 0, 0, 0))
    nd = ImageDraw.Draw(notif)
    ncx, ncy = scaled(512), scaled(512)
    nr = scaled(225)
    nd.ellipse([ncx - nr, ncy - nr, ncx + nr, ncy + nr], fill=WHITE)
    nd.polygon(
        [(scaled(450), scaled(716)), (scaled(350), scaled(800)), (scaled(390), scaled(690))],
        fill=WHITE,
    )
    ndr = scaled(22)
    for dx in (430, 512, 594):
        dcx = scaled(dx)
        nd.ellipse([dcx - ndr, ncy - ndr, dcx + ndr, ncy + ndr], fill=(0, 0, 0, 0))
    notif.resize((96, 96), Image.Resampling.LANCZOS).save(
        OUT / 'notification-icon.png', 'PNG',
    )


if __name__ == '__main__':
    main()
    print('Icons regenerated.')
