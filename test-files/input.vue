<template>
  <div>
    <p>Hello {{ someConst }}!</p>
    <MyComponent v-bind:prop="someConst" v-custom:[someConst]="otherConst" />
  </div>
</template>

<style scoped>
p {
  color: red;
}
</style>

<script lang="ts">
console.log("This is the non-setup script");
</script>

<script lang="ts" setup>
import MyComponent from "MyComponent.vue";
import { someConst, otherConst } from "some-module";
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
