<template>
  <p>Hello world!</p>
</template>

<style scoped>
p {
  color: red;
}
</style>

<script lang="ts" setup>
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
</script>
