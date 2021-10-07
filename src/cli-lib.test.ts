/* eslint-disable @typescript-eslint/no-var-requires */
import { cli } from "./cli-lib";

jest.mock("fs/promises");
jest.mock("./transformFile");
jest.mock("fast-glob");

describe("CLI", () => {
	it("honors input file and output file", async () => {
		const { stat, mkdir } = require("fs/promises") as Record<string, jest.Mock>;
		const { transformFile } = require("./transformFile") as Record<
			string,
			jest.Mock
		>;

		stat.mockResolvedValue({
			isFile: jest.fn().mockReturnValue(true),
			isDirectory: jest.fn().mockReturnValue(false),
		});

		mkdir.mockResolvedValue(undefined);

		transformFile.mockResolvedValue(undefined);

		await cli("input.ts", "output/dir/output.js");

		expect(mkdir).toHaveBeenLastCalledWith("output/dir", {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith(
			"input.ts",
			"output/dir/output.js",
		);
	});

	it("infers output file name .js", async () => {
		const { stat } = require("fs/promises") as Record<string, jest.Mock>;
		const { transformFile } = require("./transformFile") as Record<
			string,
			jest.Mock
		>;

		stat.mockResolvedValue({
			isFile: jest.fn().mockReturnValue(true),
			isDirectory: jest.fn().mockReturnValue(false),
		});

		transformFile.mockResolvedValue(undefined);

		await cli("file.ts");

		expect(transformFile).toHaveBeenCalledWith("file.ts", "file.js");
	});

	it("infers output file name .jsx", async () => {
		const { stat } = require("fs/promises") as Record<string, jest.Mock>;
		const { transformFile } = require("./transformFile") as Record<
			string,
			jest.Mock
		>;

		stat.mockResolvedValue({
			isFile: jest.fn().mockReturnValue(true),
			isDirectory: jest.fn().mockReturnValue(false),
		});

		transformFile.mockResolvedValue(undefined);

		await cli("file.tsx");

		expect(transformFile).toHaveBeenCalledWith("file.tsx", "file.jsx");
	});

	it("infers output file name from directory", async () => {
		const { stat, mkdir } = require("fs/promises") as Record<string, jest.Mock>;
		const { transformFile } = require("./transformFile") as Record<
			string,
			jest.Mock
		>;

		stat.mockImplementation(async (name: string) => {
			if (name === "file.ts") {
				return {
					isFile: jest.fn().mockReturnValue(true),
					isDirectory: jest.fn().mockReturnValue(false),
				};
			} else {
				return {
					isFile: jest.fn().mockReturnValue(false),
					isDirectory: jest.fn().mockReturnValue(true),
				};
			}
		});

		mkdir.mockResolvedValue(undefined);

		transformFile.mockResolvedValue(undefined);

		await cli("file.ts", "output/dir");

		expect(mkdir).toHaveBeenLastCalledWith("output/dir", {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith("file.ts", "output/dir/file.js");
	});

	it("walks the file system", async () => {
		const { stat, mkdir } = require("fs/promises") as Record<string, jest.Mock>;
		const { transformFile } = require("./transformFile") as Record<
			string,
			jest.Mock
		>;
		const glob = require("fast-glob") as jest.Mock;

		stat.mockResolvedValue({
			isFile: jest.fn().mockReturnValue(false),
			isDirectory: jest.fn().mockReturnValue(true),
		});

		mkdir.mockResolvedValue(undefined);

		transformFile.mockResolvedValue(undefined);

		glob.mockResolvedValue([
			"input-dir/one.ts",
			"input-dir/nested/deep/three.ts",
			"input-dir/nested/two.tsx",
		]);

		await cli("input-dir", "output/dir");

		expect(mkdir).toHaveBeenCalledWith("output/dir", { recursive: true });
		expect(mkdir).toHaveBeenCalledWith("output/dir/nested", {
			recursive: true,
		});
		expect(mkdir).toHaveBeenCalledWith("output/dir/nested/deep", {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith(
			"input-dir/one.ts",
			"output/dir/one.js",
		);
		expect(transformFile).toHaveBeenCalledWith(
			"input-dir/nested/two.tsx",
			"output/dir/nested/two.jsx",
		);
		expect(transformFile).toHaveBeenCalledWith(
			"input-dir/nested/deep/three.ts",
			"output/dir/nested/deep/three.js",
		);
	});
});
