import { defineConfig } from "vitest/config";

// Unit-test runner. `resolve.tsconfigPaths` makes the `@/*` alias from
// tsconfig.json resolve in tests, so test files import app code the same way
// the app does. Tests run in a Node environment (server actions + lib utils,
// not browser components).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
