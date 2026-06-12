# Source review queue

These sources remain **active** but carry evidence of a wrong handle, a wrong description, or a fixable URL. Each needs a human decision: correct the handle/URL, or deactivate. Evidence comes from collection-run findings recorded in `LEARNINGS.md` (May 2026). After fixing a source, delete its row here and run `node source/scripts/sync-manifest-names.js`.

## Wrong account (handle resolves to an unrelated user)

- `twitter-kylebass` — `@kylebass` resolves to "Kyle Manning", not the investor/analyst. Find the correct handle or deactivate.
- `twitter-the-diplomat` — `@TheDiplomat` resolves to a private individual. The magazine posts as a different handle.
- `twitter-armed-forces-phil` — `@ArmedForcesPhil` resolves to a zero-tweet account.
- `twitter-mndchina` — `@MNDChina` resolves to a zero-tweet private account.
- `twitter-megatronlion` — resolves to an unrelated personal account.
- `twitter-ntonc` — `@ntonc` resolves to a one-tweet account.
- `twitter-detresfa` — `@detresfa` resolves to a personal account, not the imagery analyst.
- `twitter-mda-space` — `@MdaSpace` resolves to a zero-tweet account.
- `twitter-the-koreaview` — `@TheKoreaview` resolves to a private individual (34 followers).
- `twitter-jaime-ocon` — `@JaimeOcon` resolves to a personal account (5 followers, 17 tweets), not the GIS analyst.
- `twitter-claudefb` — `@Claudefb` resolves to "Claudenice Borges" (103 followers); produces zero OSINT content.

## Fixable configuration

- `twitter-national-interest` — handle `@NationalInterest` exceeds Twitter's 15-character limit; the API returns HTTP 400. Find the real handle (likely shorter) and update the source file.
- `webpage-breaking-defense-global` — `breakingdefense.com/global/` returns 404 after a site restructure. Find the new section URL and update the source file.

## How to resolve a row

1. Verify the current handle/URL manually.
2. Edit `source/sources/<id>.md` (header + body) with the correction.
3. Run `node source/scripts/sync-manifest-names.js` to propagate the header to the manifest.
4. If no valid replacement exists, set `status: inactive` in `source/manifest.json` with a short `note`.
