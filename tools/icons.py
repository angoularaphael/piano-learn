"""Dessine les icones de l'application : le do qui brille, a cote de ses deux touches noires
(le meme motif que la touche d'entree du site).

    python tools/icons.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'icons')
os.makedirs(OUT, exist_ok=True)


def radial(size, inner, outer):
    img = Image.new('RGB', (size, size), outer)
    px = img.load()
    c = size / 2
    for y in range(size):
        for x in range(size):
            d = min(1, ((x - c) ** 2 + (y - c * 1.1) ** 2) ** 0.5 / (size * 0.62))
            px[x, y] = tuple(int(inner[i] + (outer[i] - inner[i]) * d) for i in range(3))
    return img


def vertical(w, h, top, bottom):
    g = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(g)
    for y in range(h):
        t = y / max(1, h - 1)
        d.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g


def key(img, box, top, bottom, radius, outline=None):
    x0, y0, x1, y1 = [int(v) for v in box]
    grad = vertical(x1 - x0, y1 - y0, top, bottom)
    mask = Image.new('L', grad.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, -radius, grad.size[0] - 1, grad.size[1] - 1], radius=radius, fill=255)
    img.paste(grad, (x0, y0), mask)
    if outline:
        # Contour sur les cotes et le bas seulement : le haut d'une touche est droit
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle([x0, y0 - radius, x1 - 1, y1 - 1], radius=radius, outline=outline + (255,), width=max(2, radius // 6))
        ImageDraw.Draw(layer).rectangle([0, 0, img.size[0], y0], fill=(0, 0, 0, 0))
        img.paste(layer, (0, 0), layer)


def draw(size, scale):
    S = 1024
    img = radial(S, (16, 26, 64), (4, 5, 11))
    kw, gap = 0.165 * S * scale, 0.014 * S * scale
    kh = 0.5 * S * scale
    left = S / 2 - (3 * kw + 2 * gap) / 2
    top = S / 2 - kh / 2 + 0.02 * S
    r = int(0.045 * S * scale)
    # Halo du do
    glow = Image.new('RGB', (S, S), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([left - 30 * scale, top - 10, left + kw + 30 * scale, top + kh + 40 * scale], radius=r * 2, fill=(40, 200, 230))
    glow = glow.filter(ImageFilter.GaussianBlur(70 * scale))
    img = Image.blend(img, Image.composite(glow, img, glow.convert('L')), 0.75)
    for i in range(3):
        x0 = left + i * (kw + gap)
        if i == 0:
            key(img, (x0, top, x0 + kw, top + kh), (242, 251, 255), (127, 233, 255), r)
        else:
            key(img, (x0, top, x0 + kw, top + kh), (20, 26, 59), (13, 17, 36), r, outline=(40, 48, 90))
    bw, bh = kw * 0.6, kh * 0.62
    for i in (1, 2):
        cx = left + i * (kw + gap) - gap / 2
        key(img, (cx - bw / 2, top, cx + bw / 2, top + bh), (32, 37, 90), (8, 10, 26), int(r * 0.7), outline=(120, 90, 230))
    return img.resize((size, size), Image.LANCZOS)


for name, size, scale in [('icon-192.png', 192, 1), ('icon-512.png', 512, 1), ('icon-maskable-512.png', 512, 0.78), ('apple-touch-icon.png', 180, 0.92)]:
    draw(size, scale).save(os.path.join(OUT, name), optimize=True)
    print('wrote', name)
