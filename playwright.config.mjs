import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // bypassCSP lets the checks inject test styles (for example 200% text); the site itself keeps its CSP.
  use: { baseURL: "http://localhost:4173", browserName: "chromium", bypassCSP: true },
  webServer: { command: "node tools/serve.mjs", url: "http://localhost:4173/", reuseExistingServer: !process.env.CI },
});
