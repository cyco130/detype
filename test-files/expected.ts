import type { ParsedPath } from "path";

let x: string;

// This comment should be kept

// This comment should be deleted
// Ditto for this
interface Foo {
  // This should go too
  bar: number;
}

// These two lines will be removed
console.log("Hello from TypeScript");

// These two lines will be removed
console.log("Hello from TypeScript 2");

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
