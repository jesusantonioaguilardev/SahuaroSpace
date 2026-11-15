"""
Recorta las hojas de expresiones de los personajes (6 columnas x 4 filas)
y quita el fondo blanco para que se vean bien sobre el tema oscuro.

Uso (desde la carpeta del proyecto):
    python design/recortar_personajes.py

Salida: mobile/composeApp/src/commonMain/composeResources/drawable/<personaje>_<expresion>.png
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "personajes"
OUT = ROOT / "mobile" / "composeApp" / "src" / "commonMain" / "composeResources" / "drawable"
SIZE = 256  # tamaño final de cada expresión

# Nombre de cada celda, fila por fila (igual que en las hojas)
GRIDS = {
    "luma": [
        ["idle", "wave", "joy", "wink", "thinking", "cool"],
        ["love", "blush", "coffee", "music", "laptop", "reading"],
        ["trophy", "exercise", "meditate", "sleep", "cheer", "idea"],
        ["heart_eyes", "surprised", "sad", "determined", "sparkle", "thumbs_up"],
    ],
    "pipo": [
        ["idle", "wave", "joy", "wink", "thinking", "cool"],
        ["blush", "love", "popcorn", "gaming", "music", "cheer"],
        ["laptop", "exercise", "trophy", "meditate", "sleep", "idea"],
        ["heart_eyes", "surprised", "sad", "angry", "reading", "celebrate"],
    ],
    "nix": [
        ["idle", "wave", "tablet", "thinking", "idea", "cheer"],
        ["joy", "love", "calm", "meditate", "laptop", "reading"],
        ["surprised", "worried", "sad", "sleep", "determined", "strong"],
        ["heart_eyes", "dizzy", "cool", "celebrate", "thumbs_up", "wink"],
    ],
}

# Retratos grandes de la imagen de presentación (x0, x1) en la franja de arriba
PORTRAITS = {"luma": (40, 500), "pipo": (500, 900), "nix": (900, 1330)}


def remove_white(img: Image.Image) -> Image.Image:
    """Hace transparente el fondo claro conectado al borde, con borde suave.
    El color del fondo se toma de los bordes de la imagen (blanco o beige)."""
    rgb = np.asarray(img.convert("RGB")).astype(np.int16)
    edges = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(edges, axis=0)
    diff = np.abs(rgb - bg).max(axis=2)          # 0 = igual al fondo
    light = diff < 40

    labels, _ = ndimage.label(light)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, border[border > 0])

    # Huecos cerrados del color del fondo entre las piernas: grandes y en la mitad de abajo
    # (en la mitad de arriba están las ondas y brillos blancos del cuerpo, que se conservan)
    holes = (diff < 25) & ~background
    hole_labels, nh = ndimage.label(holes)
    if nh:
        hole_sizes = ndimage.sum(holes, hole_labels, range(1, nh + 1))
        centers = ndimage.center_of_mass(holes, hole_labels, range(1, nh + 1))
        for i, (size, (cy, _cx)) in enumerate(zip(hole_sizes, centers), start=1):
            if size > 0.004 * diff.size and cy > 0.6 * diff.shape[0]:
                background |= hole_labels == i

    alpha = np.full(diff.shape, 255, dtype=np.uint8)
    # Dentro del fondo: transparente; tonos cercanos al fondo: semitransparentes (antialias)
    alpha[background] = np.clip((diff[background] - 10) * 255 // 30, 0, 255).astype(np.uint8)
    edge = ndimage.binary_dilation(background) & ~background
    alpha[edge] = np.minimum(alpha[edge], 230)

    # Quita restos de los personajes vecinos: piezas pequeñas que tocan el borde de la celda
    solid = alpha > 40
    parts, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, parts, range(1, n + 1))
        touching = set(np.unique(np.concatenate([parts[0], parts[-1], parts[:, 0], parts[:, -1]]))) - {0}
        for i, size in enumerate(sizes, start=1):
            if i in touching and size < 0.04 * solid.sum():
                alpha[parts == i] = 0

    out = np.dstack([rgb.astype(np.uint8), alpha])
    return Image.fromarray(out, "RGBA")


def trim_and_square(img: Image.Image, size: int, pad: int = 6) -> Image.Image:
    bbox = img.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
    if bbox:
        img = img.crop(bbox)
    w, h = img.size
    side = max(w, h) + pad * 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    count = 0
    for name, grid in GRIDS.items():
        sheet = Image.open(SRC / f"{name}_hoja.jpg").convert("RGB")
        cw, ch = sheet.width // 6, sheet.height // 4
        for r, row in enumerate(grid):
            for c, expression in enumerate(row):
                cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
                trim_and_square(remove_white(cell), SIZE).save(OUT / f"{name}_{expression}.png", optimize=True)
                count += 1

    pres = Image.open(SRC / "presentacion.jpg").convert("RGB")
    for name, (x0, x1) in PORTRAITS.items():
        portrait = remove_white(pres.crop((x0, 30, x1, 620)))
        trim_and_square(portrait, 512, pad=10).save(OUT / f"{name}_portrait.png", optimize=True)
        count += 1
    print(f"{count} imágenes en {OUT}")


if __name__ == "__main__":
    main()
