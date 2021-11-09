import fs from "fs";
import { transform, removeMagicComments } from "./transform";
import { resolveConfig } from "prettier";

const { readFile, writeFile } = fs.promises;

export async function transformFile(
	inputFileName: string,
	outputFileName: string,
): Promise<void> {
	const code = await readFile(inputFileName, "utf-8");
	const prettierConfig = await resolveConfig(inputFileName);
	const output = await transform(code, inputFileName, prettierConfig);
	await writeFile(outputFileName, output, "utf-8");
}

export async function removeMagicCommentsFromFile(
	inputFileName: string,
	outputFileName: string,
): Promise<void> {
	const code = await readFile(inputFileName, "utf-8");
	const output = await removeMagicComments(code);
	await writeFile(outputFileName, output, "utf-8");
}
