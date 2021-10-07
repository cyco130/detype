import { transform } from "./transform";
import fs from "fs";
import path from "path";

describe("transform function", () => {
	it("output matches expected", async () => {
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
});
