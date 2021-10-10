import { Options as PrettierOptions } from "prettier";

export { PrettierOptions };

/**
 * Transform TypeScript code into vanilla JavaScript without affecting the formatting
 * @param code            Source coude
 * @param fileName        File name for the source (useful for distinguishing between .ts and .tsx)
 * @param prettierOptions Options to pass to prettier
 */
export function transform(
	code: string,
	fileName: string,
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

/**
 * Removes magic comments without performing the TS to JS transform
 * @param input
 */
export function removeMagicComments(input: string): string;
