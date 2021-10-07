# detype

> Remove types, keep formatting

**detype** is a command line tool to remove type annotations and other TypeScript specific syntax constructs and output vanilla JavaScript **without altering the source formatting** too much.

In other words, it turns this:

```ts
import type { ParsedPath } from "path";

let x: string;

// This comment should be kept

// This comment should be deleted
// Ditto for this
interface Foo {
  // This should go too
  bar: number;
}

// This comment should also be kept
export function bar(foo: Foo): Date {
  return new Date();
}
```

into this:

```js
let x;

// This comment should be kept

// This comment should also be kept
export function bar(foo) {
  return new Date();
}
```

One possible use case is generating vanilla JavaScript code samples from TypeScript, removing the need to maintain two separate versions of what is essentially the same code.

## CLI Usage

```sh
detype input.ts output.js
detype file.ts # Output to file.js
detype file.tsx # Output to file.jsx
detype file.ts output-dir # Output to output-dir/file.sjs
detype input-dir output-dir # Process recursively, rename .ts(x) as .js(x)
```

## Node API

```ts
// Transform TypeScript code into vanilla JavaScript without affecting the formatting
function transform(
	// Source coude
	code: string,
	// File name for the source (useful for distinguishing between .ts and .tsx)
	fileName: string,
	// Options to pass to prettier
	prettierOptions?: PrettierOptions | null,
): Promise<string>;

// Transform the input file and write the output to another file
function transformFile(
	inputFileName: string,
	outputFileName: string,
): Promise<void>;
```
