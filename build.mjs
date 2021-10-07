import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import rimraf from "rimraf";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { promisify } from "util";

async function run() {
	process.chdir(dirname(fileURLToPath(import.meta.url)));

	await promisify(rimraf)("dist");

	await esbuild.build({
		logLevel: "info",
		entryPoints: ["src/index.ts"],
		outdir: "dist",
		platform: "node",
		target: ["node12"],
		plugins: [nodeExternalsPlugin()],
		watch: process.argv[2] === "--watch",
	});
}

run();
