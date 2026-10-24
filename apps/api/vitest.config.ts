import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          compatibilityDate: "2025-06-01",
          compatibilityFlags: ["nodejs_compat"],
        },
      },
    },
    workspace: [
      {
        test: {
          name: "unit-node",
          environment: "node",
          passWithNoTests: true,
          include: [
            "src/**/*.spec.ts",
            "test/unit/**/*.{spec,test}.ts",
            "test/**/*.{spec,test}.ts",
          ],
          exclude: ["test/integration/**", "**/*.worker.test.ts"],
        },
      },
      {
        test: {
          name: "workers-runtime",
          passWithNoTests: true,
          pool: "@cloudflare/vitest-pool-workers",
          include: [
            "test/integration/**/*.{spec,test}.ts",
            "test/**/*.worker.test.ts",
            "src/**/*.worker.test.ts",
          ],
          poolOptions: {
            workers: {
              wrangler: { configPath: "./wrangler.toml" },
              miniflare: {
                compatibilityDate: "2025-06-01",
                compatibilityFlags: ["nodejs_compat"],
              },
            },
          },
        },
      },
    ],
  },
});
