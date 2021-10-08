import { transformAsync } from "@babel/core";
import type { VisitNodeObject, Node } from "@babel/traverse";
import { format, Options as PrettierOptions } from "prettier";
import {
	parseComponent as parseVueComponent,
	SFCDescriptor as ParsedVue,
} from "vue-template-compiler";

// @ts-expect-error: No typinggs needed
import babelTs from "@babel/preset-typescript";

export async function transform(
	code: string,
	fileName: string,
	prettierOptions?: PrettierOptions | null,
): Promise<string> {
	const originalCode = code;
	const originalFileName = fileName;

	let parsedVue: ParsedVue | undefined;

	if (fileName.endsWith(".vue")) {
		parsedVue = parseVueComponent(code);
		if (!parsedVue.script || parsedVue.script.lang !== "ts") return code;
		code = parsedVue.script.content;
		fileName = fileName + ".ts";
	}

	// Babel visitor to remove leading comments
	const removeComments: VisitNodeObject<unknown, Node> = {
		enter(p) {
			if (!p.node.leadingComments) return;

			for (let i = p.node.leadingComments.length - 1; i >= 0; i--) {
				const comment = p.node.leadingComments[i];

				if (code.slice(comment.end).match(/^\s*\n\s*\n/)) {
					// There is at least one empty line between the comment and the TypeScript specific construct
					// We should keep this comment and those before it
					break;
				}
				comment.value = "@detype: remove-me";
			}
		},
	};

	const babelOutput = await transformAsync(code, {
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
		],
		presets: [babelTs],
		generatorOpts: {
			shouldPrintComment: (comment) => comment !== "@detype: remove-me",
		},
	});

	if (
		!babelOutput ||
		babelOutput.code === undefined ||
		babelOutput.code === null
	) {
		throw new Error("Babel error");
	}

	code = babelOutput.code;

	if (parsedVue) {
		let before = originalCode.slice(0, parsedVue.script!.start);
		const suffix = originalCode.slice(parsedVue.script!.end);

		// We have to backtrack to remove lang="ts", not fool-proof but should work for all reasonable code
		const matches = before.match(/\blang\s*=\s*["']ts["']/);
		if (matches) {
			const lastMatch = matches[matches.length - 1];
			const lastMatchIndex = before.lastIndexOf(lastMatch);
			before =
				before.slice(0, lastMatchIndex) +
				before.slice(lastMatchIndex + lastMatch.length);
		}

		code = before + code + suffix;
	}

	const prettierOutput = format(code, {
		...prettierOptions,
		filepath: originalFileName,
	});

	return prettierOutput;
}
