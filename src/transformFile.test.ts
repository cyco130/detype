/* eslint-disable @typescript-eslint/no-var-requires */
import { transformFile } from "./transformFile";

jest.mock("fs", () => ({
	promises: {
		readFile: jest.fn().mockResolvedValue("some text"),
		writeFile: jest.fn(),
	},
}));

jest.mock("prettier", () => ({
	resolveConfig: jest.fn().mockResolvedValue("mock prettier config"),
}));

jest.mock("./transform", () => ({
	transform: jest.fn().mockResolvedValue("transformed text"),
}));

describe("transformFile function", () => {
	it("transforms file", async () => {
		const { readFile, writeFile } = require("fs").promises;
		const { resolveConfig } = require("prettier");
		const { transform } = require("./transform");

		await transformFile("input.ts", "output.js");

		expect(readFile).toHaveBeenCalledWith("input.ts", "utf-8");

		expect(resolveConfig).toHaveBeenCalledWith("input.ts");

		expect(transform).toHaveBeenCalledWith(
			"some text",
			"input.ts",
			"mock prettier config",
		);

		expect(writeFile).toHaveBeenCalledWith(
			"output.js",
			"transformed text",
			"utf-8",
		);
	});
});
