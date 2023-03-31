import { describe, it, expect, vi } from "vitest";
import { removeMagicCommentsFromFile, transformFile } from "./transformFile";

vi.mock("fs", () => ({
	default: {
		promises: {
			readFile: vi.fn().mockResolvedValue("some text"),
			writeFile: vi.fn(),
		},
	},
}));

vi.mock("prettier", () => ({
	resolveConfig: vi.fn().mockResolvedValue("mock prettier config"),
}));

vi.mock("./transform", () => ({
	transform: vi.fn().mockResolvedValue("transformed text"),
	removeMagicComments: vi
		.fn()
		.mockResolvedValue("text with magic comments removed"),
}));

describe("transformFile function", () => {
	it("transforms file", async () => {
		const { readFile, writeFile } = (await import("node:fs")).default.promises;
		const { resolveConfig } = await import("prettier");
		const { transform } = await import("./transform");

		await transformFile("input.ts", "output.js");

		expect(readFile).toHaveBeenCalledWith("input.ts", "utf-8");

		expect(resolveConfig).toHaveBeenCalledWith("input.ts");

		expect(transform).toHaveBeenCalledWith("some text", "input.ts", {
			prettierOptions: "mock prettier config",
		});

		expect(writeFile).toHaveBeenCalledWith(
			"output.js",
			"transformed text",
			"utf-8",
		);
	});
});

describe("removeMagicCommentsFromFile function", () => {
	it("removes magic comments", async () => {
		const { readFile, writeFile } = (await import("node:fs")).default.promises;
		const { resolveConfig } = await import("prettier");
		const { removeMagicComments } = await import("./transform");

		await removeMagicCommentsFromFile("input.ts", "output.ts");

		expect(readFile).toHaveBeenCalledWith("input.ts", "utf-8");

		expect(resolveConfig).toHaveBeenCalledWith("input.ts");

		expect(removeMagicComments).toHaveBeenCalledWith(
			"some text",
			"input.ts",
			"mock prettier config",
		);

		expect(writeFile).toHaveBeenCalledWith(
			"output.ts",
			"text with magic comments removed",
			"utf-8",
		);
	});
});
