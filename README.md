# heveliusai.com

The public website of Hevelius AI Group LLC: one static page, plain HTML and CSS, no framework,
and no build step a visitor depends on. The requirements are locked in the Notion page
"Hevelius website: proposal and requirements"; [`REQUIREMENTS.md`](REQUIREMENTS.md) maps each story to its check.

## What is where

| Path | What it is |
| --- | --- |
| `site/` | Everything that is published, and nothing else. |
| `site/index.html` | The page and all its text. |
| `site/styles.css` | Colors, type and layout. Colors are tokens at the top; dark follows the system. |
| `site/site.js` | The copy-address button only. The page works fully without it. |
| `site/fonts/` | Montserrat, IBM Plex Sans and IBM Plex Mono (Latin, WOFF2), with their open-font licences. |
| `site/img/` | The emblem (the owner's detailed logo, cropped on a navy plate), icons and the share image. |
| `tests/` | Automated checks, run on every pull request. |
| `tools/` | Local server, font copy and image generation. Not published. |

## Changing the text

Open `site/index.html` on GitHub, click the pencil, edit the words between the tags, and choose
"Create a new branch and start a pull request". The checks run on the pull request; merge it when they are green.

## Running the checks locally

Needs Node 22.

```sh
npm ci
npx playwright install chromium
npm run check    # HTML validation and every Playwright check
npm run serve    # preview at http://localhost:4173/
```

`npm run fonts` re-copies the fonts from the npm packages; `npm run images` re-renders the icons and share image.

## Before going live

1. Check the version on the status line and in the team table against the latest Agile Dev Team release
   (`site/index.html`, and `VERSION` in `tests/site.spec.mjs`).
2. Replace "GitHub repository: to be updated." with the real link, or remove it.
3. Replace the evidence illustration with one from a real run, if one is available (keep the "Illustration" caption).
4. Move the code to the Hevelius repository with GitHub's "Transfer ownership", make it public,
   and set Settings → Pages → Source to "GitHub Actions". The `deploy` job in `.github/workflows/site.yml`
   then publishes `site/` on every merge to `main`.
5. Set the custom domain `heveliusai.com` in Settings → Pages and tick "Enforce HTTPS".
6. At Porkbun, list the Google Workspace mail records (MX, SPF, DKIM, DMARC) first, then point the apex
   (A records 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and `www` (CNAME to the
   Pages host) to GitHub Pages. Leave the mail records untouched and check them afterwards.
7. Confirm the live emblem arrives compressed (`content-encoding: gzip` on `/img/emblem.svg`), run a
   link-preview check on the address, and send a test email to contact@heveliusai.com.
8. Owner's manual pass: one real iPhone and one real Android phone, portrait and landscape, light and dark;
   keyboard only on desktop; 200% zoom; a screen reader over the headings and the team table.
9. Remove the small print under step 2 once version 0.2 is released.
