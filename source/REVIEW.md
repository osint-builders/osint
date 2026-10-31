# Source review queue

The paused access failures below need a reliable collection path before reactivation. Personal accounts and opinion posts can produce useful OSINT leads; qualification decides whether a candidate supports a published event. A wrong identity, private account, or inactive feed cannot produce useful tips.

## Account audit resolved on 2026-10-31

The following corrected accounts are eligible for Identify with `status: testing`; each source file now carries the actual handle:

- `twitter-kylebass` → `@Jkylebass`. [An interview with Kyle Bass](https://www.coindesk.com/podcasts/the-breakdown-with-nlw-episode/the-4-wars-we-could-fight-with-china-feat-kyle-bass) identifies the handle and covers China security risk.
- `twitter-the-diplomat` → `@Diplomat_APAC`. [The magazine names its account](https://thediplomat.com/2015/06/happening-now-ask-us-anything-on-defense-in-the-asia-pacific/).
- `twitter-armed-forces-phil` → `@TeamAFP`. The [Armed Forces of the Philippines lists it](https://www.afp.mil.ph/images/PDF/Cyber%20Bulletin/2025/2025-10-01_Cyber%20Bulletin%202025-10.pdf) as an official account.
- `twitter-mndchina` → `@MND_China`. [China's defense ministry announced it](https://eng.mod.gov.cn/2025xb/N/T/16426031.html).
- `twitter-detresfa` → `@detresfa_`. [US Indo-Pacific Command cites Damien Symon under that handle](https://www.pacom.mil/Portals/55/Documents/Legal/J06%20TACAID%20-%20PRC%20LAND%20BORDERS%20LAW%20-%20FINAL.pdf); [recent posts](https://teapaw.org/detresfa_) cover military imagery and airspace notices, rather than maritime distress calls.
- `twitter-mda-space` → `@MDA_space`. [MDA Space links the account](https://mda.space/connect) and posts defense-related geospatial product news.
- `twitter-jaime-ocon` → `@JaimeOcon1`. [Jaime Ocon identifies his account](https://jaimeo.substack.com/about) and reports on Taiwan security.
- `twitter-national-interest` → `@TheNatlInterest`. The [publisher names its account](https://cftni.org/recent-events/center-for-the-national-interest-appoints-paul-saunders-as-new-president/); the [publication covers defense and foreign policy](https://nationalinterest.org/about-the-national-interest).

Four source entries and files were removed: `twitter-megatronlion` and `twitter-ntonc` lacked a supported active OSINT identity; `twitter-the-koreaview` resolved to a private unrelated account; `twitter-claudefb` resolved to an unrelated personal account with no OSINT content. The earlier May 2026 review had already marked three of these four inactive in the manifest; this audit removes the stale records entirely.

## Access blocked on the Actions runner

- The 11 formerly processable `reddit-*` sources returned HTTP 403 from the public JSON endpoint in [Identify run 41220062754](https://github.com/osint-builders/osint/actions/runs/41220062754). They now have `status: inactive`; their source specs remain for reactivation. [Reddit requires OAuth or login from hosted-provider IPs](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data), and this repository has no approved credentials. The proposed `reddit-fetch` browser redirect reached a CAPTCHA and direct JSON remained blocked in a local test, so it cannot repair unattended Identify. Public RSS also rate-limits requests, and [Reddit says RSS support ends November 13, 2026](https://support.reddithelp.com/hc/en-us/articles/54353370049684-Changelog-October-8-2026), with no replacement for feeds outside communities an account moderates. The same notice says new public API access requests stop October 31, 2026.
- A manual [Browse AI connection probe](https://github.com/osint-builders/osint/actions/runs/41227212654) authenticated from GitHub Actions on October 31 and found zero robots for the GitHub Actions key. It did not access Reddit. Browse AI offers a [subreddit template](https://www.browse.ai/t/scrape-reddit-post-homepage-subreddit), but its example posting times are relative, and its API cannot run a robot before one exists in the account. [Reddit prohibits scraping without an authorized agreement](https://support.reddithelp.com/hc/en-us/articles/360043512931-Don-t-break-the-site); its [public-content policy](https://support.reddithelp.com/hc/en-us/articles/26410290525844-Public-Content-Policy) also restricts sensitive-event monitoring and intelligence uses. Keep these sources inactive until written approval covers this workflow, a selected robot exists, and an authorized live test proves exact post timestamps and reliable access.
- `webpage-isw-iran-middle-east` and `webpage-isw-russia-ukraine-research` returned HTTP 403 in that run. Known ISW feed URLs also returned HTTP 403 in a direct check. Both pages now have `status: inactive` until a supported publisher endpoint or access arrangement works; the separate `twitter-thestudyofwar` source remains active.
- `webpage-yahoo-world-news` returned HTTP 429 in that run. Yahoo's World RSS endpoint returns HTTP 404; the working top-stories feed contains mostly unrelated US politics and finance and would waste qualification capacity. The source now has `status: inactive` until a stable scoped feed works.

## How to resolve a remaining blocker

1. Test an authorized or publisher-supported access path from the Actions runner.
2. Update the adapter and source specification, then exercise the relevant Identify fixture.
3. Run `node source/scripts/sync-manifest-names.js --check` after any header change.
4. Restore `status: testing` in both the manifest and source spec only after the supported access path passes a live Identify run. Keep blocked sources visible here until then.
