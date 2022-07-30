import type { ParsedPath } from "path";

let x: string;

// This comment should be kept

// This comment should be deleted
// Ditto for this
interface Foo {
  // This should go too
  bar: number;
}

// @detype: replace
// These two lines will be removed
console.log("Hello from TypeScript");
// @detype: with
// // Notice the double comments!
// console.log("Hello from JavaScript");
// @detype: end

// @detype: replace
// These two lines will be removed
console.log("Hello from TypeScript 2");
// @detype: with
// console.log("Hello from JavaScript 2");
// @detype: end

// This comment should also be kept
export function bar(foo: Foo): Date {
  return new Date();
}

const templateLiteral: string = `one

two
`;

const stringLiteral: string = "one\
\
two\
";

// @ts-ignore: This should be removed
const xxx: string = 3;
