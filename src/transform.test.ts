import { transform } from "./transform";
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
});
