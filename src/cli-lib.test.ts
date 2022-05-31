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

		expect(mkdir).toHaveBeenLastCalledWith("output/dir", {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith(
			"input.ts",
			"output/dir/output.js",
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

		expect(transformFile).toHaveBeenCalledWith("file.ts", "file.js");
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

		expect(transformFile).toHaveBeenCalledWith("file.tsx", "file.jsx");
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

		expect(mkdir).toHaveBeenLastCalledWith("output/dir", {
			recursive: true,
		});

		expect(transformFile).toHaveBeenCalledWith("file.ts", "output/dir/file.js");
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
			"input-dir/one.ts",
			"input-dir/nested/two.tsx",
			"input-dir/nested/deep/three.vue",
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
			"input-dir/nested/deep/three.vue",
			"output/dir/nested/deep/three.vue",
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

		expect(mkdir).toHaveBeenLastCalledWith("output/dir", {
			recursive: true,
		});

		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			"input.ts",
			"output/dir/output.ts",
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

		expect(mkdir).toHaveBeenLastCalledWith("output/dir", {
			recursive: true,
		});

		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			"file.ts",
			"output/dir/file.ts",
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
			"input-dir/one.ts",
			"input-dir/nested/two.tsx",
			"input-dir/nested/deep/three.vue",
		]);

		await cli("-m", "input-dir", "output/dir");

		expect(mkdir).toHaveBeenCalledWith("output/dir", { recursive: true });
		expect(mkdir).toHaveBeenCalledWith("output/dir/nested", {
			recursive: true,
		});
		expect(mkdir).toHaveBeenCalledWith("output/dir/nested/deep", {
			recursive: true,
		});

		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			"input-dir/one.ts",
			"output/dir/one.ts",
		);
		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			"input-dir/nested/two.tsx",
			"output/dir/nested/two.tsx",
		);
		expect(removeMagicCommentsFromFile).toHaveBeenCalledWith(
			"input-dir/nested/deep/three.vue",
			"output/dir/nested/deep/three.vue",
		);
	});
});
