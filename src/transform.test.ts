import { describe, it, expect } from "vitest";
import {
	transform,
	processMagicComments,
	removeMagicComments,
} from "./transform";
import fs from "fs";
import path from "path";

describe("transform function", () => {
	it("transforms TypeScript file", async () => {
		const input = await fs.promises.readFile(
			path.resolve(__dirname, "../test-files/input.ts"),
			"utf-8",
		);

		const expected = await fs.promises.readFile(
			path.resolve(__dirname, "../test-files/expected.js"),
			"utf-8",
		);

		const output = await transform(input, "input.ts");

		expect(output).toBe(expected);
	});

	it("transforms Vue file", async () => {
		const input = await fs.promises.readFile(
			path.resolve(__dirname, "../test-files/input.vue"),
			"utf-8",
		);

		const expected = await fs.promises.readFile(
			path.resolve(__dirname, "../test-files/expected.vue"),
			"utf-8",
		);

		const output = await transform(input, "input.vue");

		expect(output).toBe(expected);
	});

	it("processes magic comments", async () => {
		const input = `// @detype: replace\nconsole.log("Hello from TypeScript");\n// @detype: with\n// console.log("Hello from JavaScript");\n// @detype: end\n`;
		const output = processMagicComments(input);
		expect(output.trim()).toBe(`console.log("Hello from JavaScript");`);
	});

	it("removes magic comments", async () => {
		const input = await fs.promises.readFile(
			path.resolve(__dirname, "../test-files/input.ts"),
			"utf-8",
		);

		const expected = await fs.promises.readFile(
			path.resolve(__dirname, "../test-files/expected.ts"),
			"utf-8",
		);

		const output = removeMagicComments(input, "input.ts");

		expect(output).toBe(expected);
	});
});
