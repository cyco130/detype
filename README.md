# detype

> Remove types, keep formatting

**detype** is a command line tool to remove type annotations and other TypeScript specific syntax constructs and output vanilla JavaScript **without altering the source formatting** too much.

One possible use case is generating vanilla JavaScript code samples from TypeScript, removing the need to maintain two separate versions of what is essentially the same code.

## CLI Usage

```sh
detype input.ts output.js
detype file.ts # Output to file.js
detype file.tsx # Output to file.jsx
detype file.ts output-dir # Output to output-dir/file.sjs
detype input-dir output-dir # Process recursively, rename .ts(x) as .js(x)
```
