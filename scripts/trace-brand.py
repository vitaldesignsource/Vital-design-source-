"""Rebuild vector geometry from the approved transparent crest master.

Optional artwork tooling: Pillow, vtracer==0.6.15, fonttools[woff], brotli.
Run from the repository root after npm ci, then npm run assets:brand.
The application build never runs Python. Review new geometry before publishing.
"""

import json
import tempfile
from pathlib import Path
from xml.etree import ElementTree as ET

import vtracer
from PIL import Image
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def outline(text, font_path, size, x, baseline, tracking, weight=None):
    font = TTFont(font_path)
    if weight:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=False)
    glyphs = font.getGlyphSet()
    character_map = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    paths = []
    cursor = x
    for character in text:
        name = character_map[ord(character)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        if pen.getCommands():
            paths.append({
                "d": pen.getCommands(),
                "transform": f"translate({cursor:.3f},{baseline}) scale({scale:.6f},{-scale:.6f})",
            })
        cursor += font["hmtx"].metrics[name][0] * scale + tracking
    return paths


master = Path("source-assets/crest-refined-master.png")
vector = Path("source-assets/brand/crest-refined-vector.svg")
vector.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="vital-crest-") as temporary:
    bitmap = Path(temporary) / "trace.png"
    # The alpha threshold removes faint transparent noise; it does not recolor
    # or alter the retained master. Binary tracing needs an opaque white field.
    Image.open(master).convert("RGBA").getchannel("A").point(
        lambda alpha: 0 if alpha > 160 else 255
    ).convert("RGB").save(bitmap)
    vtracer.convert_image_to_svg_py(
        str(bitmap), str(vector), colormode="binary", mode="spline",
        filter_speckle=24, corner_threshold=60, length_threshold=6.0,
        max_iterations=10, splice_threshold=45, path_precision=2,
    )

root = ET.parse(vector).getroot()
geometry = {
    "viewBox": f"0 0 {root.get('width')} {root.get('height')}",
    # The shield is path four in this approved master. Recheck this mapping
    # if replacing the master; automatic tracing can change path order.
    "shieldIndex": 4,
    "paths": [{"d": path.get("d"), "transform": path.get("transform")} for path in root],
}
Path("src/lib/crest-geometry.json").write_text(json.dumps(geometry, indent=2) + "\n")
letters = outline(
    "VITAL", "node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
    88, 324, 139, 12, 500,
)
letters += outline(
    "DESIGN SOURCE", "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
    24, 328, 195, 4,
)
Path("source-assets/brand/wordmark-paths.json").write_text(json.dumps(letters, separators=(",", ":")) + "\n")
print("Rebuilt crest and outlined wordmark geometry. Review before exporting.")
