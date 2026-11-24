"""Dessine les icones de l'application aux couleurs de la palette Nuit (celles d'EAM) : trois touches
d'ivoire sur le bleu nuit, et le do entoure a la feuille d'or, comme sur la touche d'entree du site.

    python tools/icons.py
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'icons')
os.makedirs(OUT, exist_ok=True)

PAPER = (8, 16, 29)        # le bleu nuit
IVORY = (243, 238, 228)    # l'ivoire des touches
INK = (8, 16, 29)          # les noires et les filets, dans le bleu du fond
RED = (201, 169, 110)      # l'or d'EAM


def draw(size, scale):
    S = 2048  # dessine en grand, puis reduit : des bords nets a toutes les tailles
    img = Image.new('RGB', (S, S), PAPER)
    d = ImageDraw.Draw(img)
    w = 0.7 * S * scale
    h = 0.6 * S * scale
    x0 = S / 2 - w / 2
    y0 = S / 2 - h / 2 - 0.01 * S
    line = max(6, int(0.026 * S * scale))
    thin = max(4, int(0.02 * S * scale))
    # Les trois blanches (do, re, mi)
    d.rectangle([x0, y0, x0 + w, y0 + h], fill=IVORY, outline=INK, width=line)
    kw = w / 3
    for i in (1, 2):
        x = x0 + i * kw
        d.line([(x, y0), (x, y0 + h)], fill=INK, width=thin)
    # Les deux noires, un peu decalees comme sur un vrai clavier (do# a gauche, re# a droite)
    bw, bh = kw * 0.54, h * 0.6
    for i, shift in ((1, -0.08), (2, 0.08)):
        cx = x0 + i * kw + shift * kw
        d.rectangle([cx - bw / 2, y0, cx + bw / 2, y0 + bh], fill=INK)
    # Le do entoure au crayon rouge : un ovale qui depasse son depart
    cx = x0 + kw * 0.5
    cy = y0 + bh + (h - bh) * 0.5
    rx = kw * 0.34
    ry = (h - bh) * 0.33
    pts = []
    for k in range(121):
        t = k / 120
        a = -2.3 + (2 * math.pi + 0.6) * t
        r1 = 1 + 0.05 * math.sin(t * 7)
        pts.append((cx + 0.04 * kw * t + rx * r1 * math.cos(a), cy - 0.03 * kw * t + ry * r1 * math.sin(a)))
    d.line(pts, fill=RED, width=max(6, int(0.024 * S * scale)), joint='curve')
    for p in (pts[0], pts[-1]):
        r = 0.012 * S * scale
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=RED)
    return img.resize((size, size), Image.LANCZOS)


for name, size, scale in [('icon-192.png', 192, 1), ('icon-512.png', 512, 1), ('icon-maskable-512.png', 512, 0.74), ('apple-touch-icon.png', 180, 0.9)]:
    draw(size, scale).save(os.path.join(OUT, name), optimize=True)
    print('wrote', name)
