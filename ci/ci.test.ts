import { test, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES = fileURLToPath(
	new URL("../packages/detype/test-files/", import.meta.url),
);
const DIST_CLI = fileURLToPath(
	new URL("../packages/detype/dist/cli.js", import.meta.url),
);

beforeAll(() => {
	if (!existsSync(DIST_CLI)) {
		throw new Error(
			`Built CLI not found at ${DIST_CLI}. Run 'pnpm build' first.`,
		);
	}
});

function withTmpDir(fn: (dir: string) => void) {
	const dir = mkdtempSync(join(tmpdir(), "detype-ci-"));
	try {
		fn(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

function readFixture(name: string): string {
	return readFileSync(join(FIXTURES, name), "utf8").replaceAll("\r\n", "\n");
}

function readOutput(path: string): string {
	return readFileSync(path, "utf8").replaceAll("\r\n", "\n");
}

function runDetype(...args: string[]) {
	const quoted = args.map((a) => JSON.stringify(a)).join(" ");
	execSync(`pnpm exec detype ${quoted}`, { stdio: "inherit" });
}

test("CLI transforms TypeScript to JavaScript", () => {
	withTmpDir((dir) => {
		const output = join(dir, "output.js");
		runDetype("-t", join(FIXTURES, "input.ts"), output);
		expect(readOutput(output)).toBe(readFixture("expected.js"));
	});
});

test("CLI transforms Vue SFC", () => {
	withTmpDir((dir) => {
		const output = join(dir, "output.vue");
		runDetype(join(FIXTURES, "input.vue"), output);
		expect(readOutput(output)).toBe(readFixture("expected/input.vue"));
	});
});

test("CLI removes magic comments only (-m)", () => {
	withTmpDir((dir) => {
		const output = join(dir, "output.ts");
		runDetype("-m", join(FIXTURES, "input.ts"), output);
		expect(readOutput(output)).toBe(readFixture("expected.ts"));
	});
});
