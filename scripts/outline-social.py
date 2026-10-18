"""Rebuild checked-in social-image lettering from the site's bundled fonts.

Run from the repository root after npm ci:
    python scripts/outline-social.py

Optional offline tooling: fonttools[woff] and brotli. Normal application builds
and `npm run assets` use the committed JSON paths and never require Python.
Fontsource's Space Grotesk and IBM Plex Mono SIL Open Font License notices are
retained in public/licenses. Output is outlined geometry, with no embedded fonts.
"""

import json
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parents[1]
SPACE_GROTESK = ROOT / (
    "node_modules/@fontsource-variable/space-grotesk/files/"
    "space-grotesk-latin-wght-normal.woff2"
)
IBM_PLEX_MONO = ROOT / (
    "node_modules/@fontsource/ibm-plex-mono/files/"
    "ibm-plex-mono-latin-400-normal.woff2"
)
OUTPUT = ROOT / "source-assets/brand/social-lettering.json"


def outline(text, font_path, size, x, baseline, tracking, fill, weight=None):
    """Place glyph outlines with explicit advances and letter spacing in pixels."""
    font = TTFont(font_path)
    if weight is not None:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=False)
    glyphs = font.getGlyphSet()
    characters = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    cursor = x
    paths = []
    for character in text:
        glyph_name = characters[ord(character)]
        pen = SVGPathPen(glyphs)
        glyphs[glyph_name].draw(pen)
        commands = pen.getCommands()
        if commands:
            paths.append({
                "d": commands,
                "fill": fill,
                "transform": (
                    f"translate({cursor:.6f},{baseline}) "
                    f"scale({scale:.8f},{-scale:.8f})"
                ),
            })
        cursor += font["hmtx"].metrics[glyph_name][0] * scale + tracking
    font.close()
    return paths


def main():
    paths = outline(
        "VITAL DESIGN SOURCE", IBM_PLEX_MONO,
        17, 140, 94, 2, "#f1f2eb",
    )
    paths += outline(
        "Ideas beyond", SPACE_GROTESK,
        78, 52, 288, -4, "#f1f2eb", weight=400,
    )
    paths += outline(
        "ordinary.", SPACE_GROTESK,
        78, 52, 378, -4, "#b8d9c3", weight=400,
    )
    paths += outline(
        "Design. Intelligence. Motion.", SPACE_GROTESK,
        17, 57, 548, 0, "#acb8ae", weight=400,
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(paths, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(paths)} outlined glyphs to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
