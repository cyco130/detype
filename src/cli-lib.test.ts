import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cli } from "./cli-lib";

vi.mock("fs", async () => {
	// Partial mock to make Babel happy
	const fs = ((await vi.importActual("fs")) as any).default;

	return {
		default: {
			...fs,
			promises: {
				...fs.promises,
				stat: vi.fn(),
				mkdir: vi.fn(),
			},
		},
	};
});
vi.mock("./transformFile");
vi.mock("fast-glob");

const originalConsoleError = console.error;

beforeEach(() => {
	console.error = vi.fn();
});

afterEach(() => {
	console.error = originalConsoleError;
});

describe("TypeScript to JavaScript conversion", () => {
	it("honors input file and output file", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		const { transformFile } = await import("./transformFile");

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(true),
			isDirectory: vi.fn().mockReturnValue(false),
		} as any);

		vi.mocked(mkdir).mockResolvedValue(undefined);

		vi.mocked(transformFile).mockResolvedValue(undefined);

		await cli("input.ts", "output/dir/output.js");

		expect(mkdir).toHaveBeenLastCalledWith(path.normalize("output/dir"), {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith(
			"input.ts",
			path.normalize("output/dir/output.js"),
			{ removeTsComments: false },
		);
	});

	it("infers output file name .js", async () => {
		const { stat } = (await import("fs")).default.promises;
		const { transformFile } = await import("./transformFile");

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(true),
			isDirectory: vi.fn().mockReturnValue(false),
		} as any);

		vi.mocked(transformFile).mockResolvedValue(undefined);

		await cli("file.ts");

		expect(transformFile).toHaveBeenCalledWith("file.ts", "file.js", {
			removeTsComments: false,
		});
	});

	it("infers output file name .jsx", async () => {
		const { stat } = (await import("fs")).default.promises;
		const { transformFile } = await import("./transformFile");

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(true),
			isDirectory: vi.fn().mockReturnValue(false),
		} as any);

		vi.mocked(transformFile).mockResolvedValue(undefined);

		await cli("file.tsx");

		expect(transformFile).toHaveBeenCalledWith("file.tsx", "file.jsx", {
			removeTsComments: false,
		});
	});

	it("rejects implicitly overwriting .vue files", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(true),
			isDirectory: vi.fn().mockReturnValue(false),
		} as any);
		vi.mocked(mkdir).mockResolvedValue(undefined);

		const result = await cli("file.vue");
		expect(result).toBe(false);
		expect(console.error).toHaveBeenCalledWith(
			"Output file name is required for .vue files",
		);
	});

	it("infers output file name from directory", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		const { transformFile } = await import("./transformFile");

		vi.mocked(stat as any).mockImplementation(async (name: string) => {
			if (name === "file.ts") {
				return {
					isFile: vi.fn().mockReturnValue(true),
					isDirectory: vi.fn().mockReturnValue(false),
				};
			} else {
				return {
					isFile: vi.fn().mockReturnValue(false),
					isDirectory: vi.fn().mockReturnValue(true),
				};
			}
		});

		vi.mocked(mkdir).mockResolvedValue(undefined);

		vi.mocked(transformFile).mockResolvedValue(undefined);

		await cli("file.ts", "output/dir");

		expect(mkdir).toHaveBeenLastCalledWith(path.normalize("output/dir"), {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith(
			"file.ts",
			path.normalize("output/dir/file.js"),
			{ removeTsComments: false },
		);
	});

	it("walks the file system", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		const { transformFile } = await import("./transformFile");
		const glob = (await import("fast-glob")).default;

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(false),
			isDirectory: vi.fn().mockReturnValue(true),
		} as any);

		vi.mocked(mkdir).mockResolvedValue(undefined);

		vi.mocked(transformFile).mockResolvedValue(undefined);

		vi.mocked(glob).mockResolvedValue([
			path.normalize("input-dir/one.ts"),
			path.normalize("input-dir/nested/two.tsx"),
			path.normalize("input-dir/nested/deep/three.vue"),
		]);

		await cli("input-dir", "output/dir");

		expect(mkdir).toHaveBeenCalledWith(path.normalize("output/dir"), {
			recursive: true,
		});
		expect(mkdir).toHaveBeenCalledWith(path.normalize("output/dir/nested"), {
			recursive: true,
		});
		expect(mkdir).toHaveBeenCalledWith(
			path.normalize("output/dir/nested/deep"),
			{
				recursive: true,
			},
		);

		expect(transformFile).toHaveBeenCalledWith(
			path.normalize("input-dir/one.ts"),
			path.normalize("output/dir/one.js"),
			{ removeTsComments: false },
		);
		expect(transformFile).toHaveBeenCalledWith(
			path.normalize("input-dir/nested/two.tsx"),
			path.normalize("output/dir/nested/two.jsx"),
			{ removeTsComments: false },
		);
		expect(transformFile).toHaveBeenCalledWith(
			path.normalize("input-dir/nested/deep/three.vue"),
			path.normalize("output/dir/nested/deep/three.vue"),
			{ removeTsComments: false },
		);
	});

	it("honors --remove-ts-comments", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		const { transformFile } = await import("./transformFile");

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(true),
			isDirectory: vi.fn().mockReturnValue(false),
		} as any);

		vi.mocked(mkdir).mockResolvedValue(undefined);

		vi.mocked(transformFile).mockResolvedValue(undefined);

		await cli("input.ts", "output/dir/output.js", "-t");

		expect(mkdir).toHaveBeenLastCalledWith(path.normalize("output/dir"), {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith(
			"input.ts",
			path.normalize("output/dir/output.js"),
			{ removeTsComments: true },
		);
	});
});

describe("TypeScript magic comment removal", () => {
	it("honors input file and output file", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		const { removeMagicCommentsFromFile } = await import("./transformFile");

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(true),
			isDirectory: vi.fn().mockReturnValue(false),
		} as any);

		vi.mocked(mkdir).mockResolvedValue(undefined);

		vi.mocked(removeMagicCommentsFromFile).mockResolvedValue(undefined);

		await cli("-m", "input.ts", "output/dir/output.ts");

		expect(mkdir).toHaveBeenLastCalledWith(path.normalize("output/dir"), {
			recursive: true,
		});

		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			"input.ts",
			path.normalize("output/dir/output.ts"),
		);
	});

	it("rejects when output file name is not given", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(true),
			isDirectory: vi.fn().mockReturnValue(false),
		} as any);
		vi.mocked(mkdir).mockResolvedValue(undefined);

		const result = await cli("-m", "file.ts");
		expect(result).toBe(false);
		expect(console.error).toHaveBeenCalledWith(
			"Output file name is required when removing magic comments",
		);
	});

	it("infers output file name from directory", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		const { removeMagicCommentsFromFile } = await import("./transformFile");

		vi.mocked(stat as any).mockImplementation(async (name: string) => {
			if (name === "file.ts") {
				return {
					isFile: vi.fn().mockReturnValue(true),
					isDirectory: vi.fn().mockReturnValue(false),
				};
			} else {
				return {
					isFile: vi.fn().mockReturnValue(false),
					isDirectory: vi.fn().mockReturnValue(true),
				};
			}
		});

		vi.mocked(mkdir).mockResolvedValue(undefined);

		vi.mocked(removeMagicCommentsFromFile).mockResolvedValue(undefined);

		await cli("-m", "file.ts", "output/dir");

		expect(mkdir).toHaveBeenLastCalledWith(path.normalize("output/dir"), {
			recursive: true,
		});

		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			"file.ts",
			path.normalize("output/dir/file.ts"),
		);
	});

	it("walks the file system", async () => {
		const { stat, mkdir } = (await import("fs")).default.promises;
		const { removeMagicCommentsFromFile } = await import("./transformFile");
		const glob = (await import("fast-glob")).default;

		vi.mocked(stat).mockResolvedValue({
			isFile: vi.fn().mockReturnValue(false),
			isDirectory: vi.fn().mockReturnValue(true),
		} as any);

		vi.mocked(mkdir).mockResolvedValue(undefined);

		vi.mocked(removeMagicCommentsFromFile).mockResolvedValue(undefined);

		vi.mocked(glob).mockResolvedValue([
			path.normalize("input-dir/one.ts"),
			path.normalize("input-dir/nested/two.tsx"),
			path.normalize("input-dir/nested/deep/three.vue"),
		]);

		await cli("-m", "input-dir", "output/dir");

		expect(mkdir).toHaveBeenCalledWith(path.normalize("output/dir"), {
			recursive: true,
		});
		expect(mkdir).toHaveBeenCalledWith(path.normalize("output/dir/nested"), {
			recursive: true,
		});
		expect(mkdir).toHaveBeenCalledWith(
			path.normalize("output/dir/nested/deep"),
			{
				recursive: true,
			},
		);

		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			path.normalize("input-dir/one.ts"),
			path.normalize("output/dir/one.ts"),
		);
		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			path.normalize("input-dir/nested/two.tsx"),
			path.normalize("output/dir/nested/two.tsx"),
		);
		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			path.normalize("input-dir/nested/deep/three.vue"),
			path.normalize("output/dir/nested/deep/three.vue"),
		);
	});
});
