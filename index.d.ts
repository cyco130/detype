import { Options as PrettierOptions } from "prettier";

/**
 * Transform TypeScript code into vanilla JavaScript without affecting the formatting
 * @param code            Source coude
 * @param filename        File name for the source (useful for distinguishing between .ts and .tsx)
 * @param prettierOptions Options to pass to prettier
 */
export function transform(
	code: string,
	filename: string,
	prettierOptions?: PrettierOptions | null | undefined,
): Promise<string>;

/**
 * Transform the input file and write the output to another file
 * @param inputFileName
 * @param outputFileName
 */
export function transformFile(
	inputFileName: string,
	outputFileName: string,
): Promise<void>;
