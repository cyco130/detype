# detype

> Remove the types, keep the formatting

```sh
npm i -g detype
```

Suppose you have a library that you want to provide usage examples for. **detype** can help you generate vanilla JavaScript samples from TypeScript samples automatically and remove the burden of maintaining two separate versions of what is essentially the same code.

It is a command line tool and a library that removes type annotations and other TypeScript specific syntax constructs and outputs vanilla JavaScript **without altering the source formatting** too much. It supports `.ts`, `.tsx`, as well as `.vue` files.

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

The output is very close to hand-written JavaScript, especially if you were already using Prettier for formatting.

## Doesn't `tsc` already do that?

There are lots of tools for transpiling TypeScript into plain JavaScript (`tsc`, `babel`, `swc`, `esbuild`, `sucrase` etc.) but none of them is perfectly suitable for this specific use case. Most of them don't preserve the formatting at all. `sucrase` comes close, but it doesn't remove comments attached to TypeScript-only constructs.

`detype` uses [Babel](https://babeljs.io/), a small Babel plugin to remove comments attached to TypeScript-only constructs, and [Prettier](https://prettier.io/) under the hood. For Vue files, it also uses the tools from the [VueDX project](https://github.com/vuedx/languagetools).

## Magic comments

Sometimes you want the generated JavaScript to be slightly different than the TypeScript original. You can use the magic comments feature to achieve this:

Input:

```ts
// @detype: replace
// These two lines will be removed
console.log("Hello from TypeScript");
// @detype: with
// // Notice the double comments!
// console.log("Hello from JavaScript");
// @detype: end
```

Output:

```js
// Notice the double comments!
console.log("Hello from JavaScript");
```

If you just want to remove the magic comments, you can use the `-m` CLI flag or the `removeMagicComments` function to generate uncluttered TypeScript like this:

```ts
// These two lines will be removed
console.log("Hello from TypeScript");
```

## System requirements

`detype` requires Node version 12.22.7 or later.

## CLI Usage

```
detype [-m | --remove-magic-comments] <INPUT> [OUTPUT]

  INPUT   Input file or directory

  OUTPUT  Output file or directory
    (optional if it can be inferred and it won't overwrite the source file)

  -m, --remove-magic-comments
    Remove magic comments only, don't perform ts > js transform

detype [-v | --version]

  Print version and exit

detype [-h | --help]

  Print this help and exit
```

## Node API

```ts
// Transform TypeScript code into vanilla JavaScript without affecting the formatting
function transform(
	// Source code
	code: string,
	// File name for the source
	fileName: string,
	// Options to pass to prettier
	prettierOptions?: PrettierOptions | null,
): Promise<string>;

// Transform the input file and write the output to another file
function transformFile(
	inputFileName: string,
	outputFileName: string,
): Promise<void>;

// Remove magic comments without performing the TS to JS transform
export function removeMagicComments(
	// Source code
	code: string,
	// File name for the source
	fileName: string,
	// Options to pass to prettier
	prettierOptions?: PrettierOptions | null,
): string;

// Remove magic comments from the input file and write the output to another file
export function removeMagicCommentsFromFile(
	inputFileName: string,
	outputFileName: string,
): Promise<void>;
```

## Change log

### 0.4

- feature: CLI support for removing magic comments
- chore: Improve documentation

### 0.3

- feature: Magic comments
- feature: Expose type declarations
- fix: Better empty line handling

### 0.2

- feature: for Vue single file components

### 0.1

- Initial release

## Credits

Fatih Aygün, under MIT License
