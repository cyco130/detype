import {
	transformAsync,
	TransformOptions as BabelTransformOptions,
} from "@babel/core";
import type { VisitNodeObject, Node } from "@babel/traverse";
import { format } from "prettier";
import {
	parse as parseVueSfc,
	SFCTemplateBlock as VueSfcTemplateBlock,
	SFCScriptBlock as VueSfcScriptBlock,
} from "@vuedx/compiler-sfc";
import { compileScript } from "@vue/compiler-sfc";
import {
	traverse as traverseVueAst,
	isSimpleExpressionNode as isVueSimpleExpressionNode,
	isComponentNode as isVueComponentNode,
} from "@vuedx/template-ast-types";
import type { PrettierOptions } from ".";

// @ts-expect-error: No typinggs needed
import babelTs from "@babel/preset-typescript";

// Needed for Node 14
// @ts-expect-error: No typinggs
import { shim } from "string.prototype.replaceall";
shim();

function getDefinePropsObject(content: string) {
	const matched = /\sprops:\s*\{/m.exec(content);
	if (matched) {
		const startContentIndex = matched.index + matched[0].length - 1;
		let leftBracketCount = 1;
		let endContentIndex = startContentIndex + 1;
		while (leftBracketCount) {
			if (content.charAt(endContentIndex) === "{") {
				leftBracketCount++;
			} else if (content.charAt(endContentIndex) === "}") {
				leftBracketCount--;
			}
			endContentIndex++;
		}
		return content.substring(startContentIndex, endContentIndex);
	}
	return "";
}

type VueElementNode = VueSfcTemplateBlock["ast"];

export interface RemoveTypeOptions {
	/** Whether to remove ts-ignore and ts-expect-error comments */
	removeTsComments?: boolean;
	/** Escape hatch for customizing Babel configuration */
	customizeBabelConfig?(config: BabelTransformOptions): void;
}

export interface TransformOptions extends RemoveTypeOptions {
	/** Prettier options */
	prettierOptions?: PrettierOptions | null;
}

/**
 * Transform TypeScript code into vanilla JavaScript without affecting the formatting
 * @param code            Source coude
 * @param fileName        File name for the source
 * @param options         Options
 */
export async function transform(
	code: string,
	fileName: string,
	options: TransformOptions = {},
): Promise<string> {
	const { prettierOptions, ...removeTypeOptions } = options;

	const originalCode = code;
	const originalFileName = fileName;
	let propsContent = "";
	let emitsContent = "";

	code = code.replaceAll("\r\n", "\n");

	if (fileName.endsWith(".vue")) {
		const parsedVue = parseVueSfc(code);

		if (
			parsedVue.descriptor.script?.lang !== "ts" &&
			parsedVue.descriptor.scriptSetup?.lang !== "ts"
		) {
			// No TypeScript, don't touch it
			return originalCode;
		}

		let { script: script1, scriptSetup: script2 } = parsedVue.descriptor;

		const isContainsDefinePropsType =
			script2?.content.match(/defineProps\s*</m);
		const isContainsDefineEmitType = script2?.content.match(/defineEmits\s*</m);

		if (isContainsDefinePropsType || isContainsDefineEmitType) {
			const { content } = compileScript(parsedVue.descriptor as any, {
				id: "xxxxxxx",
			});

			if (isContainsDefinePropsType) {
				propsContent = getDefinePropsObject(content);
			}
			if (isContainsDefineEmitType) {
				emitsContent = content.match(/\semits:\s(\[.*\]?)/m)?.[1] || "";
			}
		}

		// Process the second script first to simplify code location handling
		if (
			script1 &&
			script2 &&
			script1.loc.start.offset < script2.loc.start.offset
		) {
			[script2, script1] = [script1, script2];
		}

		code = await removeTypesFromVueSfcScript(
			code,
			fileName,
			script1,
			parsedVue.descriptor.template?.ast,
			removeTypeOptions,
		);

		code = await removeTypesFromVueSfcScript(
			code,
			fileName,
			script2,
			parsedVue.descriptor.template?.ast,
			removeTypeOptions,
		);
	} else {
		code = await removeTypes(code, fileName, removeTypeOptions);
	}

	if (propsContent) {
		code = code.replace("defineProps(", (str) => `${str}${propsContent}`);
	}
	if (emitsContent) {
		code = code.replace("defineEmits(", (str) => `${str}${emitsContent}`);
	}

	code = format(code, {
		...prettierOptions,
		filepath: originalFileName,
	});

	return code;
}

async function removeTypes(
	code: string,
	fileName: string,
	options: RemoveTypeOptions,
) {
	// We want to collapse newline runs created by removing types while preserving
	// newline runes in the original code. This is especially important for
	// template literals, which can contain literal newlines.
	// Keep track of how many newlines in a newline run were replaced.
	code = code.replace(
		/\n\n+/g,
		(match) => `\n/* @detype: empty-line=${match.length} */\n`,
	);
	code = processMagicComments(code);

	// Babel visitor to remove leading comments
	const removeComments: VisitNodeObject<unknown, Node> = {
		enter(p) {
			if (!p.node.leadingComments) return;

			for (let i = p.node.leadingComments.length - 1; i >= 0; i--) {
				const comment = p.node.leadingComments[i];

				if (
					code.slice(comment.end).match(/^\s*\n\s*\n/) ||
					comment.value.includes("@detype: empty-line")
				) {
					// There is at least one empty line between the comment and the TypeScript specific construct
					// We should keep this comment and those before it
					break;
				}
				comment.value = "@detype: remove-me";
			}
		},
	};

	const babelConfig: BabelTransformOptions = {
		filename: fileName,
		retainLines: true,
		plugins: [
			// Plugin to remove leading comments attached to TypeScript-only constructs
			{
				name: "detype-comment-remover",
				visitor: {
					TSTypeAliasDeclaration: removeComments,
					TSInterfaceDeclaration: removeComments,
					TSDeclareFunction: removeComments,
					TSDeclareMethod: removeComments,
					TSImportType: removeComments,
				},
			},
		].filter(Boolean),
		presets: [babelTs],
		generatorOpts: {
			shouldPrintComment: (comment) =>
				comment !== "@detype: remove-me" &&
				(!options.removeTsComments ||
					!comment.match(/^\s*(@ts-ignore|@ts-expect-error)/)),
		},
	};

	if (options.customizeBabelConfig) {
		options.customizeBabelConfig(babelConfig);
	}

	const babelOutput = await transformAsync(code, babelConfig);

	if (
		!babelOutput ||
		babelOutput.code === undefined ||
		babelOutput.code === null
	) {
		throw new Error("Babel error");
	}

	return (
		babelOutput.code
			.replaceAll(/\n\n*/g, "\n")
			// Subtract 2 from the newline count because we inserted two surrounding
			// newlines when we initially created the detype: empty-line comment.
			.replace(/\/\* @detype: empty-line=([0-9]+) \*\//g, (_match, p1) =>
				`\n`.repeat(p1 - 2),
			)
	);
}

async function removeTypesFromVueSfcScript(
	code: string,
	fileName: string,
	script: VueSfcScriptBlock | null,
	templateAst: VueElementNode | undefined,
	options: RemoveTypeOptions,
) {
	if (script === null || script.lang !== "ts") return code;

	if (script.setup && templateAst) {
		// Babel TypeScript preset removes unused exports thinking they may be type-only exports.
		// We have to mark every import that the template references to mark them as used.

		const expressions = new Set<string>();

		traverseVueAst(templateAst, {
			enter(node) {
				if (isVueSimpleExpressionNode(node) && !node.isStatic) {
					expressions.add(`[${node.content}]`);
				} else if (isVueComponentNode(node)) {
					expressions.add(`[${node.tag}]`);
				}
			},
		});

		// We'll simply add them at the end of the template
		script.content +=
			"/* @detype: remove-after-this */" + [...expressions].join(";");
	}

	let scriptCode = await removeTypes(script.content, fileName + ".ts", options);

	const removeAfterIndex = scriptCode.indexOf(
		"/* @detype: remove-after-this */",
	);

	if (removeAfterIndex >= 0) {
		scriptCode = scriptCode.slice(0, removeAfterIndex);
	}

	let before = code.slice(0, script.loc.start.offset);
	const after = code.slice(script.loc.end.offset);

	// We have to backtrack to remove lang="ts", not fool-proof but should work for all reasonable code
	const matches = before.match(/\blang\s*=\s*["']ts["']/);

	if (matches) {
		const lastMatch = matches[matches.length - 1];
		const lastMatchIndex = before.lastIndexOf(lastMatch);
		before =
			before.slice(0, lastMatchIndex) +
			before.slice(lastMatchIndex + lastMatch.length);
	}

	return before + scriptCode + after;
}

export function processMagicComments(input: string): string {
	const REPLACE_COMMENT = "// @detype: replace\n";
	const WITH_COMMENT = "// @detype: with\n";
	const END_COMMENT = "// @detype: end\n";

	let start = input.indexOf(REPLACE_COMMENT);

	while (start >= 0) {
		const middle = input.indexOf(WITH_COMMENT, start);
		if (middle < 0) return input;
		const middleEnd = middle + WITH_COMMENT.length;

		const end = input.indexOf(END_COMMENT, middleEnd);
		if (end < 0) return input;
		const endEnd = end + END_COMMENT.length;

		const before = input.slice(0, start);
		const newText = input.slice(middleEnd, end).replaceAll(/^\s*\/\//gm, "");
		const after = input.slice(endEnd);

		input = before + newText + after;

		start = input.indexOf(REPLACE_COMMENT, before.length + newText.length);
	}

	return input;
}

/**
 * Removes magic comments without performing the TS to JS transform
 * @param code            Source coude
 * @param fileName        File name for the source
 * @param prettierOptions Options to pass to prettier
 */
export function removeMagicComments(
	code: string,
	fileName: string,
	prettierOptions?: PrettierOptions | null,
): string {
	const REPLACE_COMMENT = "// @detype: replace\n";
	const WITH_COMMENT = "// @detype: with\n";
	const END_COMMENT = "// @detype: end\n";

	let start = code.indexOf(REPLACE_COMMENT);
	let startEnd = start + REPLACE_COMMENT.length;

	while (start >= 0) {
		const middle = code.indexOf(WITH_COMMENT, start);
		if (middle < 0) return code;
		const middleEnd = middle + WITH_COMMENT.length;

		const end = code.indexOf(END_COMMENT, middleEnd);
		if (end < 0) return code;
		const endEnd = end + END_COMMENT.length;

		const before = code.slice(0, start);
		const keptText = code.slice(startEnd, middle);
		const after = code.slice(endEnd);

		code = before + keptText + after;

		start = code.indexOf(REPLACE_COMMENT, before.length + keptText.length);
		startEnd = start + REPLACE_COMMENT.length;
	}

	code = format(code, {
		...prettierOptions,
		filepath: fileName,
	});

	return code;
}
