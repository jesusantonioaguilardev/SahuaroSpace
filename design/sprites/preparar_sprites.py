"""
Prepara los sprites del modo "En vivo" (24 poses por personaje).

Entrada: carpetas con 1.png … 24.png de cada personaje (los zip de diseño, ya extraídos).
Salida:  mobile/composeApp/src/commonMain/composeResources/drawable/live_<personaje>_<nn>.webp

- Quita el fondo blanco cuando el set no trae transparencia (Nix).
- Recorta todas las poses con el MISMO cuadro (unión de los contornos) para que el
  personaje no "salte" al cambiar de pose.
- Reduce a 512 px de alto y guarda en WebP con transparencia.

Uso:
  python design/sprites/preparar_sprites.py <carpeta_luma> <carpeta_pipo> <carpeta_nix>
"""
import os
import sys
from collections import deque

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'mobile', 'composeApp', 'src', 'commonMain', 'composeResources', 'drawable')
HEIGHT = 512
WORK = 1200  # tamaño intermedio para quitar el fondo rápido


def remove_white_background(img: Image.Image) -> Image.Image:
    """Relleno desde los bordes: solo el blanco conectado al exterior se vuelve transparente
    (los brillos blancos dentro del personaje se conservan)."""
    rgb = img.convert('RGB')
    w, h = rgb.size
    px = rgb.load()
    mask = Image.new('L', (w, h), 255)
    m = mask.load()

    def whiteish(p):
        r, g, b = p
        return r > 228 and g > 228 and b > 228 and max(r, g, b) - min(r, g, b) < 24

    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if m[x, y] == 0 or not whiteish(px[x, y]):
            continue
        m[x, y] = 0
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # Borde suave para que no se vea dentado
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert('RGBA')
    out.putalpha(mask)
    return out


def load_set(folder: str):
    frames = []
    for i in range(1, 25):
        im = Image.open(os.path.join(folder, f'{i}.png'))
        scale = WORK / im.height
        im = im.resize((round(im.width * scale), WORK), Image.LANCZOS)
        if im.mode != 'RGBA' or im.getchannel('A').getextrema()[0] == 255:
            im = remove_white_background(im)
        frames.append(im.convert('RGBA'))
    return frames


def common_box(frames, margin=12):
    boxes = [f.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox() for f in frames]
    l = min(b[0] for b in boxes); t = min(b[1] for b in boxes)
    r = max(b[2] for b in boxes); b_ = max(b[3] for b in boxes)
    w, h = frames[0].size
    return max(0, l - margin), max(0, t - margin), min(w, r + margin), min(h, b_ + margin)


def main():
    if len(sys.argv) != 4:
        print(__doc__); sys.exit(1)
    os.makedirs(OUT, exist_ok=True)
    for name, folder in zip(['luma', 'pipo', 'nix'], sys.argv[1:]):
        frames = load_set(folder)
        box = common_box(frames)
        for i, f in enumerate(frames, start=1):
            c = f.crop(box)
            c = c.resize((round(c.width * HEIGHT / c.height), HEIGHT), Image.LANCZOS)
            c.save(os.path.join(OUT, f'live_{name}_{i:02d}.webp'), 'WEBP', quality=88, method=6)
        print(name, 'ok', box)


if __name__ == '__main__':
    main()
