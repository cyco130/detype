import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/cli.ts"],
		format: ["esm"],
		fixedExtension: false,
		target: "node20",
		dts: { oxc: true },
	},
	{
		entry: ["src/index.ts"],
		format: ["cjs"],
		fixedExtension: false,
		target: "node20",
		dts: { oxc: true },
	},
]);
