import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
  outputDir: "output/playwright/test-results",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    viewport: {
      width: 390,
      height: 844,
    },
  },
  webServer: {
    command:
      "sh -lc 'mkdir -p .codex-e2e-empty && CODEX_HOME=$PWD/.codex-e2e-empty OPENAI_API_KEY= OPENAI_CODEX_MODEL= NEXTAUTH_SECRET=test-secret NEXTAUTH_URL=http://127.0.0.1:3001 npm run db:seed && CODEX_HOME=$PWD/.codex-e2e-empty OPENAI_API_KEY= OPENAI_CODEX_MODEL= NEXTAUTH_SECRET=test-secret NEXTAUTH_URL=http://127.0.0.1:3001 npm run build && CODEX_HOME=$PWD/.codex-e2e-empty OPENAI_API_KEY= OPENAI_CODEX_MODEL= NEXTAUTH_SECRET=test-secret NEXTAUTH_URL=http://127.0.0.1:3001 npm run start -- --hostname 127.0.0.1 --port 3001'",
    url: "http://127.0.0.1:3001/login",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
