// Checks for heveliusai.com. Story codes (E1-S2-1 and so on) refer to section 8 of the
// Notion page "Hevelius website: proposal and requirements".
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const EMAIL = "contact@heveliusai.com";
// Must match the latest release of Agile Dev Team on the day the site goes live.
const VERSION = "0.1.0";

// Phones in portrait, the same phones in landscape, then tablet and desktop (section 6).
const PHONES = [[320, 568], [360, 740], [375, 667], [390, 844], [412, 915], [430, 932]];
const VIEWPORTS = [
  ...PHONES.map(([w, h]) => ({ name: `${w} portrait`, width: w, height: h })),
  ...PHONES.map(([w, h]) => ({ name: `${w} landscape`, width: h, height: w })),
  { name: "768 tablet", width: 768, height: 1024 },
  { name: "1280 desktop", width: 1280, height: 800 },
];

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function open(page) {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

// Returns a description of every element that pokes out sideways or is clipped,
// ignoring content inside the areas that scroll on their own (.scroll).
function layoutProblems() {
  const vw = document.documentElement.clientWidth;
  const problems = [];
  if (document.documentElement.scrollWidth > vw) {
    problems.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${vw}`);
  }
  for (const el of document.querySelectorAll("body *")) {
    const scroller = el.closest(".scroll");
    if (scroller && scroller !== el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const name = `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").join(".") : ""}`;
    if (r.left < -0.5 || r.right > vw + 0.5) problems.push(`${name} is outside the screen (${Math.round(r.left)} to ${Math.round(r.right)} of ${vw})`);
    const cs = getComputedStyle(el);
    if (!el.classList.contains("scroll") && cs.overflowX !== "visible" && el.scrollWidth > el.clientWidth + 1) {
      problems.push(`${name} clips its content`);
    }
  }
  return problems;
}

test.describe("E1-S2-2: no sideways scrolling at any width", () => {
  for (const vp of VIEWPORTS) {
    test(vp.name, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await open(page);
      expect(await page.evaluate(layoutProblems)).toEqual([]);
    });
  }
});

test.describe("E1-S2-5: the phone's largest text size (200%)", () => {
  for (const [w, h] of [[320, 568], [390, 844], [844, 390]]) {
    test(`${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await open(page);
      await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
      expect(await page.evaluate(layoutProblems)).toEqual([]);
    });
  }
});

test("E1-S2-1: works with scripts off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();

  const nav = page.getByRole("navigation", { name: "Main" }).getByRole("link");
  await expect(nav).toHaveText(["Mission", "Agile Dev Team", "Advisory", "Contact"]);
  for (const id of ["mission", "product", "advisory", "contact"]) {
    await page.locator(`nav a[href="#${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }

  // The copy button needs a script, so it is not shown without one.
  await expect(page.getByRole("button", { name: "Copy address" })).toBeHidden();
  await context.close();
});

test("E1-S2-3 and E3-S1-2: dark theme follows the system and passes the accessibility scan", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await open(page);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(11, 31, 58)");
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test.describe("E1-S1-1: accessibility scan, WCAG 2.2 AA", () => {
  for (const scheme of ["light", "dark"]) {
    for (const width of [320, 1280]) {
      test(`${scheme} at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.emulateMedia({ colorScheme: scheme });
        await open(page);
        const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});

test("E1-S2-4: the page keeps clear of notches and system bars", async ({ page }) => {
  await open(page);
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).toContain("viewport-fit=cover");
  const css = await (await page.request.get("/styles.css")).text();
  for (const side of ["left", "right", "top", "bottom"]) expect(css).toContain(`env(safe-area-inset-${side})`);
});

test("E1-S2-6: every link and button is a 44px touch target, nothing needs hover", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  // Show the skip link as a keyboard user would see it.
  await page.keyboard.press("Tab");
  const targets = page.locator("a, button");
  const count = await targets.count();
  expect(count).toBeGreaterThan(8);
  for (let i = 0; i < count; i++) {
    const t = targets.nth(i);
    const box = await t.boundingBox();
    const label = (await t.textContent()).trim() || (await t.getAttribute("aria-label"));
    expect(box, label).not.toBeNull();
    expect(box.height, `${label} height`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${label} width`).toBeGreaterThanOrEqual(24);
  }

  // Hover may only restyle (color, underline); it never reveals or hides content.
  const hoverProps = await page.evaluate(() => {
    const props = [];
    for (const sheet of document.styleSheets) {
      const walk = (rules) => {
        for (const rule of rules) {
          if (rule.cssRules) walk(rule.cssRules);
          if (rule.selectorText && rule.selectorText.includes(":hover")) {
            for (const p of rule.style) props.push(p);
          }
        }
      };
      walk(sheet.cssRules);
    }
    return props;
  });
  for (const p of hoverProps) expect(p).toMatch(/^(color|text-decoration.*|background-color|border-color)$/);
});

test("Section 6: text is at least 16px (footer 13px), pinch-zoom is never disabled", async ({ page }) => {
  await open(page);
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale/);
  const small = await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim()) continue;
      const el = node.parentElement;
      if (el.closest(".skip")) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      // The footer may use 13px (owner decision, 9 Oct 2026); everything else stays at 16px or more.
      const min = el.closest(".site-footer") ? 13 : 16;
      if (size < min) out.push(`${size}px: ${node.textContent.trim().slice(0, 40)}`);
    }
    return out;
  });
  expect(small).toEqual([]);
});

test("Section 6: keyboard order is sensible and focus is always visible", async ({ page }) => {
  await open(page);
  const expected = await page.evaluate(() =>
    [...document.querySelectorAll('a[href], button, [tabindex="0"]')]
      .filter((el) => el.offsetParent !== null || el.classList.contains("skip"))
      .map((el) => el.outerHTML.slice(0, 80)),
  );
  for (const html of expected) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { html: el.outerHTML.slice(0, 80), outline: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
    });
    expect(focused.html).toBe(html);
    expect(focused.outline, focused.html).not.toBe("none");
    expect(focused.width, focused.html).toBeGreaterThanOrEqual(2);
  }
});

test("Section 6: motion follows the reduced-motion setting", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("Section 6: one main heading and headings in order", async ({ page }) => {
  await open(page);
  await expect(page.locator("h1")).toHaveCount(1);
  expect(await page.locator("html").getAttribute("lang")).toBe("en-US");
  const levels = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
  for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
});

test("E2-S1-1 and E2-S1-2: the opening names both offers and its buttons lead on", async ({ page }) => {
  await open(page);
  await expect(page.locator("h1")).toHaveText("AI you can trust, because you can verify it.");
  const lede = page.locator(".lede");
  await expect(lede).toContainText("We build tools that make AI prove its work.");
  await expect(lede).toContainText("We help organizations adopt AI");
  await page.getByRole("link", { name: "See Agile Dev Team" }).click();
  await expect(page).toHaveURL(/#product$/);
  await page.getByRole("link", { name: "Get in touch" }).click();
  await expect(page).toHaveURL(/#contact$/);
});

test("E2-S1-1: on a small phone the headline and its sentence come before the emblem", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page);
  const lede = await page.locator(".lede").boundingBox();
  const emblem = await page.getByRole("img", { name: /Hevelius emblem/ }).boundingBox();
  expect(lede.y + lede.height).toBeLessThanOrEqual(568);
  expect(emblem.y).toBeGreaterThan(lede.y + lede.height);
});

test("E2-S2-1 to E2-S2-3: product status, planned roles and the illustration caption", async ({ page }) => {
  await open(page);
  const status = page.locator('[data-test="status"]');
  await expect(status).toContainText(`Version ${VERSION}`);
  await expect(status).toContainText("early access");

  const rows = await page.locator("#product table tbody tr").evaluateAll((trs) =>
    trs.map((tr) => [tr.querySelector("th").textContent.trim(), tr.querySelector("td.when").textContent.trim()]),
  );
  expect(rows.length).toBe(5);
  for (const [role, when] of rows) {
    expect(when, role).toMatch(new RegExp(`^(In ${VERSION.replace(/\./g, "\\.")}|Planned, \\d+\\.\\d+)$`));
  }
  await expect(page.locator(".evidence figcaption")).toContainText("Illustration");
});

test("E2-S2-2: the team picture fits the screen, has a text alternative and marks planned roles", async ({ page }) => {
  for (const [width, shown, hidden] of [[1440, ".orbit-wide", ".orbit-narrow"], [390, ".orbit-narrow", ".orbit-wide"]]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const picture = page.locator(`.team-visual ${shown}`);
    await expect(picture).toBeVisible();
    await expect(page.locator(`.team-visual ${hidden}`)).toBeHidden();
    await expect(picture).toHaveAttribute("role", "img");
    await expect(picture).toHaveAccessibleName(/Tester and an Analyst are planned for version 0\.2/);
  }
  // Planned roles are shown by a dashed outline and in words, never by colour alone: the table
  // and the text alternative say "planned", and the phone picture has a key under it.
  await expect(page.locator(".team-visual figcaption")).toHaveText("Dashed: planned for 0.2");
  await expect(page.locator(".team-visual figcaption")).toBeVisible();
  await expect(page.locator(".orbit-wide .tv-node-planned")).toHaveCount(2);
});

test("E2-S2-2: beside the table, the whole team picture sits between the headings and the last line of text", async ({ page }) => {
  // Top edge: just under the column-heading text. Bottom edge: the top of the lowercase letters
  // (the x-height) on the table's last line of text.
  // Extra lines are added to the first and last rows, as a browser that wraps text differently would.
  for (const [width, extra] of [[1280, null], [1440, null], [1920, null], [1280, "first"], [1440, "last"]]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    if (extra) await page.evaluate((which) => {
      const rows = document.querySelectorAll("#product tbody tr");
      (which === "first" ? rows[0] : rows[rows.length - 1]).querySelector("td").innerHTML += "<br>one more line";
    }, extra);
    const m = await page.evaluate(() => {
      const table = document.querySelector("#product table");
      const rects = (el) => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()]; };
      const lastRow = [...table.querySelectorAll("tbody tr")].pop();
      const svg = document.querySelector(".team-visual .orbit-wide");
      const box = svg.getBoundingClientRect();
      const parts = [...svg.querySelectorAll("rect, circle, text, path")].map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
      return {
        top: box.top, bottom: box.bottom, left: box.left, right: box.right,
        headBottom: rects(table.querySelector("thead th"))[0].bottom,
        lastLine: (() => {
          const td = lastRow.querySelector("td");
          const mark = document.createElement("span");
          mark.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
          td.append(mark);
          const baseline = mark.getBoundingClientRect().bottom;
          mark.remove();
          const cs = getComputedStyle(td);
          const ctx = document.createElement("canvas").getContext("2d");
          ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          return baseline - ctx.measureText("x").actualBoundingBoxAscent;
        })(),
        drawnTop: Math.min(...parts.map((r) => r.top)), drawnBottom: Math.max(...parts.map((r) => r.bottom)),
        label: parseFloat(getComputedStyle(svg.querySelector(".tv-label")).fontSize) * box.height / svg.viewBox.baseVal.height,
        viewport: document.documentElement.clientWidth,
      };
    });
    const tag = `${width}${extra ? ` with an extra line in the ${extra} row` : ""}`;
    expect(Math.abs(m.top - m.headBottom), `${tag}: top under the heading text`).toBeLessThanOrEqual(2);
    expect(Math.abs(m.bottom - m.lastLine), `${tag}: bottom at the top of the last line's lowercase letters`).toBeLessThanOrEqual(2);
    expect(m.drawnTop, `${tag}: nothing above the box`).toBeGreaterThanOrEqual(m.top - 1);
    expect(m.drawnBottom, `${tag}: nothing below the box`).toBeLessThanOrEqual(m.bottom + 1);
    expect(m.label, `${tag}: names at least 16px`).toBeGreaterThanOrEqual(16);
    expect(m.left).toBeGreaterThanOrEqual(0);
    expect(m.right).toBeLessThanOrEqual(m.viewport);
    await expect(page.locator(".team-visual figcaption")).toBeHidden();
  }
});

test("E2-S2-4: the roles table scrolls inside its own area, by keyboard too", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const area = page.locator("section.scroll", { has: page.locator("table") });
  await expect(area).toHaveAttribute("tabindex", "0");
  await expect(area).toHaveAttribute("aria-label", /.+/);
  const overflows = await area.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflows).toBe(true);
  await area.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => area.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(layoutProblems)).toEqual([]);
});

test("E2-S3-1: advisory lists three offers and makes no certification claim", async ({ page }) => {
  await open(page);
  await expect(page.locator("#advisory .services h3")).toHaveText([
    "AI readiness assessment",
    "Transformation",
    "Strategy and governance",
  ]);
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\b(certified|compliant|secure)\b/i);
});

test("E2-S4-1: the address opens the mail program", async ({ page }) => {
  await open(page);
  const link = page.locator("#contact a", { hasText: EMAIL });
  await expect(link).toHaveAttribute("href", `mailto:${EMAIL}`);
  await expect(link).toBeVisible();
});

test("E2-S4-2: the copy button copies the address and announces it", async ({ browser }) => {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  await open(page);
  const status = page.getByRole("status");
  await page.getByRole("button", { name: "Copy address" }).click();
  await expect(status).toHaveText("Address copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
  await context.close();
});

test("E2-S4-3: the footer carries the legal name, privacy, accessibility and independence", async ({ page }) => {
  await open(page);
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Hevelius AI Group LLC, Florida, USA.");
  await expect(footer).toContainText("This site sets no cookies and runs no analytics.");
  await expect(footer).toContainText("This site aims to meet WCAG 2.2 level AA.");
  await expect(footer).toContainText("Hevelius AI Group is an independent company and is not affiliated with Anthropic.");
  await expect(footer).not.toContainText("Google Fonts");
});

test("Section 12: the three owner texts are word for word", async ({ page }) => {
  await open(page);
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  for (const owner of [
    "AI you can trust, because you can verify it.",
    "Hevelius AI Group is led by Christopher Zaczek. He has 15+ years in financial services transformation and consulting with seven global banking institutions and a Big Four firm. Working from financial centers including Hong Kong, Singapore and London, he advised C-level executives and delivered projects across EMEA, APAC and the US.",
    "Named for Johannes Hevelius, who published the first atlas of the Moon from his own observations. We hold AI work to the same standard: trust what is proven and recorded.",
  ]) {
    expect(text).toContain(owner);
  }
});

test("E3-S1-1: the logo is in the header and is the browser icon, with a text alternative", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("link", { name: /Hevelius AI Group/ }).locator("svg")).toBeVisible();
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "favicon.svg");
  await expect(page.getByRole("img", { name: /Hevelius emblem/ })).toBeVisible();
  for (const href of ["favicon.svg", "img/apple-touch-icon.png", "img/icon-192.png", "img/icon-512.png", "img/share.png"]) {
    expect((await page.request.get(`/${href}`)).status(), href).toBe(200);
  }
});

test("E3-S2-1 and E4-S3-1: every request stays on the site and the page weighs at most 400 KB", async ({ page }) => {
  const requests = [];
  page.on("requestfinished", (r) => requests.push(r));
  await open(page);
  await page.waitForLoadState("networkidle");
  let total = 0;
  for (const r of requests) {
    expect(new URL(r.url()).origin, r.url()).toBe("http://localhost:4173");
    total += (await r.sizes()).responseBodySize;
  }
  expect(requests.length).toBeGreaterThan(5);
  expect(total, `${Math.round(total / 1000)} KB downloaded`).toBeLessThanOrEqual(400_000);
});

test("E4-S3-2: on a throttled phone connection, content shows within 2.5 s and nothing jumps", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  // Lighthouse mobile profile (a mid-range phone on slow 4G): 150 ms round trip, 1.6 Mbit/s down, 4x slower CPU.
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(500);
  const metrics = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let lcp = 0;
        let cls = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve({ lcp, cls }), 100);
      }),
  );
  expect(metrics.lcp, `largest paint at ${Math.round(metrics.lcp)} ms`).toBeLessThanOrEqual(2500);
  expect(metrics.cls, `layout shift ${metrics.cls}`).toBeLessThanOrEqual(0.1);
});

test("E4-S2-1 and section 6: title, description, share image, robots file and sitemap", async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle("Hevelius AI Group");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Agile Dev Team/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://heveliusai.com/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.+/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://heveliusai.com/img/share.png");
  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Sitemap: https://heveliusai.com/sitemap.xml");
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://heveliusai.com/</loc>");
});
