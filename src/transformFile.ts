import { readFile, writeFile } from "fs/promises";
import { transform } from "./transform";
import { resolveConfig } from "prettier";

export async function transformFile(
	inputFileName: string,
	outputFileName: string,
): Promise<void> {
	const code = await readFile(inputFileName, "utf-8");
	const prettierConfig = await resolveConfig(inputFileName);
	const output = await transform(code, inputFileName, prettierConfig);
	await writeFile(outputFileName, output, "utf-8");
}
