import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", colorScheme: "dark" },
  projects: [
    { name: "desktop", testIgnore: "**/responsive.spec.ts", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", testIgnore: "**/responsive.spec.ts", use: { ...devices["Pixel 7"] } },
    { name: "tablet-webkit", testMatch: "**/responsive.spec.ts", use: { ...devices["iPad Air"] } },
  ],
  webServer: {
    command: "npm run start -- --port 4173 --hostname 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
