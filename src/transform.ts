import { transformAsync } from "@babel/core";
import type { VisitNodeObject, Node } from "@babel/traverse";
import { format, Options as PrettierOptions } from "prettier";

export async function transform(
	code: string,
	filename: string,
	prettierOptions?: PrettierOptions | null,
): Promise<string> {
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
		filename,
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
		presets: ["@babel/preset-typescript"],
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

	const prettierOutput = format(babelOutput.code, {
		...prettierOptions,
		filepath: filename,
	});

	return prettierOutput;
}
