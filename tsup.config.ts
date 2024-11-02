import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/cli.ts"],
		format: ["esm"],
		target: "node18",
		dts: {
			entry: "src/index.ts",
		},
	},
	{
		entry: ["src/index.ts"],
		format: ["cjs"],
		target: "node18",
		dts: {
			entry: "src/index.ts",
		},
	},
]);
