# Requirements and how each is checked

From section 8 of the Notion page "Hevelius website: proposal and requirements" (locked 8 Oct 2026).
Automated checks live in `tests/site.spec.mjs` and `.github/workflows/site.yml` and run on every pull request;
each test name starts with the story code it covers.

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| E1-S1-1 | HTML validation and accessibility scan fail the pull request | `npm run validate` (html-validate) and axe, WCAG 2.2 AA tags, light and dark, 320 and 1280 |
| E1-S1-2 | No personal email in commits | Workflow step: every author and committer in the pull request is a no-reply or `@heveliusai.com` address |
| E1-S2-1 | Works with scripts off | Landmarks, skip link and the four navigation links, with JavaScript disabled |
| E1-S2-2 | No sideways scrolling at any width | 320, 360, 375, 390, 412, 430 portrait and landscape, 768, 1280 |
| E1-S2-3 | Dark theme follows the system | Dark colors applied and axe passes in dark |
| E1-S2-4 | Clear of notches and system bars | `viewport-fit=cover` and safe-area padding on all four sides; real-phone check by the owner |
| E1-S2-5 | Largest phone text size | 200% text at 320 and 390 portrait and in landscape: nothing outside the screen or clipped |
| E1-S2-6 | 44 px touch targets, nothing needs hover | Every link and button measured; hover rules may only restyle |
| E2-S1-1, E2-S1-2 | Opening names both offers; buttons lead on | Headline and sentence text; buttons go to `#product` and `#contact` |
| E2-S2-1 | Latest version and "early access" | Status line against `VERSION`; the release itself is checked by hand before going live |
| E2-S2-2 | Roles not yet released are "Planned" with a release | Every status reads "In 0.1.0" or "Planned, x.y" |
| E2-S2-3 | Evidence example is labelled an illustration | Caption text |
| E2-S2-4 | Roles table scrolls in its own area, by keyboard | Focusable labelled area; Arrow Right scrolls it at 320 with 200% text |
| E2-S3-1 | Three offers, no certification claim | Three offer headings; no "certified", "compliant" or "secure" on the page |
| E2-S4-1 | Address opens the mail program | `mailto:` link |
| E2-S4-2 | Copy button copies and announces | Clipboard content and the `status` message "Address copied." |
| E2-S4-3 | Footer content | Legal name, privacy, accessibility and independence lines |
| E3-S1-1 | Logo in the header and as the icon, with text alternatives | Header logo, `favicon.svg`, emblem alt text, PNG icons present |
| E3-S1-2 | Contrast in both themes | axe color-contrast in light and dark |
| E3-S2-1 | Every request goes to the site itself | All requests same-origin; a Content-Security-Policy also blocks anything else |
| E4-S1-1, E4-S1-2 | HTTPS on apex and www; email still works | At going live (README, "Before going live") |
| E4-S2-1 | Link preview shows title, description and image | Open Graph tags, share image, robots file and sitemap checked; live preview at going live |
| E4-S3-1 | At most 400 KB downloaded, emblem compressed | Downloaded bytes measured (about 200 KB); live compression confirmed at going live |
| E4-S3-2 | Content within 2.5 s on a phone on 4G; layout shift at most 0.1 | Lighthouse mobile profile (150 ms, 1.6 Mbit/s, 4x CPU): largest paint and layout shift measured |

Section 6 rules also checked: one `h1` and headings in order, page language, text at least 16 px (13 px in the footer, owner decision 9 Oct 2026),
pinch-zoom never disabled, focus always visible in a sensible order, reduced motion respected.
Section 12: the three owner texts are checked word for word.
