import { stat, mkdir } from "fs/promises";
import path from "path";
import { transformFile } from "./transformFile";
import glob from "fast-glob";

export async function cli(input: string, output?: string): Promise<boolean> {
	if (!input) {
		printUsage();
		return false;
	}

	const inputStat = await stat(input);

	if (inputStat.isDirectory()) {
		if (!output) {
			console.error("No output directory given");
			printUsage();
			return false;
		}

		const files = (await glob(path.join(input, "**/*.{ts,tsx}"))).filter(
			(file) => !file.endsWith(".d.ts"),
		);
		const dirs = [...new Set(files.map((file) => path.dirname(file)))].sort();

		await mkdirp(output);

		for (const dir of dirs) {
			const outDir = path.join(output, path.relative(input, dir));
			if (outDir === output) continue;
			await mkdirp(outDir);
		}

		for (const file of files) {
			const inputDir = path.dirname(path.relative(input, file));
			const outputName = inferName(file, path.join(output, inputDir));
			await transformFile(file, outputName);
		}

		return true;
	}

	if (output) {
		const outputStat = await stat(output).catch((error) => {
			if (error && error.code === "ENOENT") {
				return null;
			}

			throw error;
		});

		if (outputStat && outputStat.isDirectory()) {
			output = inferName(input, output);
		}
	} else {
		output = inferName(input);
	}

	const outputDir = path.dirname(output);

	if (outputDir) {
		await mkdirp(outputDir);
	}

	await transformFile(input, output);

	return true;
}

function inferName(input: string, outputDir?: string) {
	let output: string;

	const { dir, name, ext } = path.parse(input);

	if (ext === ".ts") {
		output = path.join(outputDir ?? dir, name + ".js");
	} else if (ext === ".tsx") {
		output = path.join(outputDir ?? dir, name + ".jsx");
	} else {
		throw new Error(`Unknwon file extension ${input}`);
	}

	return output;
}

async function mkdirp(dir: string) {
	await mkdir(dir, { recursive: true }).catch((error) => {
		// Ignore file exists error
		if (error && error.code == "EEXIST") {
			return;
		}

		throw error;
	});
}

function printUsage() {
	console.error(`Usage:
  detype input.ts output.js
  detype file.ts # Output to file.js
  detype file.tsx # Output to file.jsx
  detype file.ts output-dir # Output to output-dir/file.sjs
  detype input-dir output-dir # Process recursively, rename .ts(x) as .js(x)`);
}
