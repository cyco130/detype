# detype

> Remove the types, keep the formatting

```sh
npm i -g detype
```

**detype** is a command line tool and library to remove type annotations and other TypeScript specific syntax constructs and output vanilla JavaScript **without altering the source formatting** too much. It supports `.ts`, `.tsx`, as well as `.vue` extensions.

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

It achieves this using [Babel](https://babeljs.io/), [Babel's TypeScript preset](https://babeljs.io/docs/en/babel-preset-typescript), a small custom Babel plugin to remove comments attached to TypeScript-only constructs, and [Prettier](https://prettier.io/). For Vue files, it uses the tools from the [VueDX project](https://github.com/vuedx/languagetools) The output is very close to hand-written JavaScript, especially if you were already using Prettier for formatting.

**One possible use case** is the following: Suppose you have a library that you want to provide usage examples for. Automatically generating vanilla JavaScript samples from TypeScript samples using `detype` would remove the burden of maintaining two separate versions of what is essentially the same code.

## Installation

```sh
npm install detype
```

`detype` requires Node version 14.18.0 or later.

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

## Change log
## 0.3
- feat: Magic comments
- feat: Expose type declarations
- fix: Better empty line handling

## 0.2
- feat: for Vue single file components

## 0.1
- Initial release

## Credits
Fatih Aygün, under MIT License