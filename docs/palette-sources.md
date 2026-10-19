# Portfolio preview color studies

The project showcase includes four representative colors derived from each
checked-in preview. The interface labels these **Color study** and **Sampled from
this preview**. They describe the displayed image, including its photography or
artwork; they are not official client brand specifications, project deliverables,
or evidence of project outcomes.

Each entry in `src/lib/project-palettes.ts` records the exact source path and its
SHA-256 checksum. All eight sources use the same 1200px WebP shown by the
showcase's image fallback. The private-release entry samples its disclosed
architectural artwork, rather than implying that it is a public website capture.
The 7 Seas Trading study uses the current `7-seas-trading-home` website preview,
not the earlier project cover.

## Reproduce the samples

From the repository root, run:

```sh
node --import tsx scripts/project-palettes.ts
npx prettier --write src/lib/project-palettes.ts
```

The script uses the existing locked Sharp dependency to resize each source to
240px wide, then quantize it into 16 colors with dithering disabled. Four distinct
entries were selected from those image-derived palettes to show a useful range
of background, typography, accent, and photographic colors. The exact selections
are retained in the script, so generation is deterministic with the checked-in
sources and lockfile. Every selected entry must exist in the computed palette;
the script fails if a changed preview needs its color study reviewed.

The swatches are decorative. Each has a visible, opaque hexadecimal label on the
same dark theme background, plus a numbered text alternative. Color is never the
only way to identify a sample. The strip becomes two columns on narrow phones.
