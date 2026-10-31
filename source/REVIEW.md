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

## Access blocked on the Actions runner

- The 11 processable `reddit-*` sources returned HTTP 403 from the public JSON endpoint in [Identify run 41162801993](https://github.com/osint-builders/osint/actions/runs/41162801993). Durable Reddit access needs an approved OAuth API integration and credentials; public RSS endpoints also rate-limit requests and cannot be relied on as a replacement.
- `webpage-isw-iran-middle-east` and `webpage-isw-russia-ukraine-research` returned HTTP 403 from ISW in the same run. The known ISW feed URLs also returned HTTP 403 in a direct check. Keep these failures visible until a supported publisher endpoint or access arrangement exists.
- `webpage-yahoo-world-news` failed to fetch on the Actions runner. Yahoo's World RSS endpoint returns HTTP 404; the working top-stories feed contains mostly unrelated US politics and finance and would waste qualification capacity. Keep the World page source visible until a stable scoped feed becomes available.

## How to resolve a row

1. Verify the current handle/URL manually.
2. Edit `source/sources/<id>.md` (header + body) with the correction.
3. Run `node source/scripts/sync-manifest-names.js` to propagate the header to the manifest.
4. If no valid replacement exists, set `status: inactive` in `source/manifest.json` with a short `note`.
