import fs from "node:fs";
import path from "node:path";
import { removeMagicCommentsFromFile, transformFile } from "./transformFile";
import fastGlob from "fast-glob";
import pkg from "../package.json";

const { stat, mkdir } = fs.promises;

export async function cli(...args: string[]): Promise<boolean> {
	let dashDash = false;
	const params: string[] = [];
	const flags: string[] = [];
	for (const arg of args) {
		if (arg === "--") {
			dashDash = true;
		} else if (dashDash || !arg.startsWith("-")) {
			params.push(arg);
		} else {
			flags.push(arg);
		}
	}

	if (params.length > 2) {
		console.error("Too many arguments");
		return false;
	}

	let [input, output] = params;

	if (
		params.length === 0 ||
		flags.some((flag) => flag === "-h" || flag === "--help")
	) {
		printUsage();
		return params.length > 0;
	}

	if (flags.some((flag) => flag === "-v" || flag === "--version")) {
		// eslint-disable-next-line no-console
		console.log(VERSION);
		return true;
	}

	const removeMagic = flags.some(
		(flag) => flag === "-m" || flag === "--remove-magic-comments",
	);
	const removeTsComments = flags.some(
		(flag) => flag === "-t" || flag === "--remove-ts-comments",
	);

	if (removeMagic && removeTsComments) {
		console.warn(
			"--remove-ts-comments has no effect when --remove-magic-comments is used",
		);
	}

	if (!removeMagic) {
		[input, output] = args;
	}

	if (!input) {
		console.error("No input file or directory given");
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

		const files = (
			await fastGlob(unixify(input + "/**/*.{ts,tsx,vue}"))
		).filter((file) => !file.endsWith(".d.ts"));
		const dirs = [...new Set(files.map((file) => path.dirname(file)))].sort();

		await mkdir(path.normalize(output), { recursive: true });

		for (const dir of dirs) {
			const outDir = path.join(output, path.relative(input, dir));
			if (outDir === output) continue;
			await mkdir(path.normalize(outDir), { recursive: true });
		}

		for (const file of files) {
			const inputDir = path.dirname(path.relative(input, file));
			const outputName = inferName(file, path.join(output, inputDir));
			removeMagic
				? await removeMagicCommentsFromFile(
						path.normalize(file),
						path.normalize(outputName),
					)
				: await transformFile(
						path.normalize(file),
						path.normalize(outputName),
						{ removeTsComments },
					);
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
		if (removeMagic) {
			console.error(
				"Output file name is required when removing magic comments",
			);
			return false;
		}

		if (input.endsWith(".vue")) {
			console.error("Output file name is required for .vue files");
			return false;
		}

		output = inferName(input);
	}

	const outputDir = path.dirname(output);

	if (outputDir) {
		await mkdir(path.normalize(outputDir), { recursive: true });
	}

	removeMagic
		? await removeMagicCommentsFromFile(
				path.normalize(input),
				path.normalize(output),
			)
		: await transformFile(path.normalize(input), path.normalize(output), {
				removeTsComments,
			});

	return true;

	function inferName(input: string, outputDir?: string) {
		let output: string;

		const { dir, name, ext } = path.parse(input);

		if (removeMagic) {
			output = path.join(outputDir ?? dir, `${name}${ext}`);
		} else if (ext === ".ts") {
			output = path.join(outputDir ?? dir, name + ".js");
		} else if (ext === ".tsx") {
			output = path.join(outputDir ?? dir, name + ".jsx");
		} else if (ext === ".vue") {
			output = path.join(outputDir ?? dir, name + ".vue");
		} else {
			throw new Error(`Unknwon file extension ${input}`);
		}

		return output;
	}
}

function printUsage() {
	console.error(USAGE);
}

const USAGE = `Usage:

  detype [-m | --remove-magic-comments] <INPUT> [OUTPUT]

    INPUT   Input file or directory

    OUTPUT  Output file or directory
      (optional if it can be inferred and it won't overwrite the source file)

    -t, --remove-ts-comments
      Remove @ts-ignore and @ts-expect-error comments

    -m, --remove-magic-comments
      Remove magic comments only, don't perform ts > js transform

  detype [-v | --version]

    Print version and exit

  detype [-h | --help]

    Print this help and exit`;

const VERSION = pkg.version;

/** Unixify path */
function unixify(name: string) {
	return name.replaceAll(path.sep, "/");
}
