<template>
  <div>
    <p>Hello {{ someConst }}!</p>
    <MyComponent v-bind:prop="someConst" v-custom:[someConst]="otherConst" />
    <div v-bind="{ ...props }"></div>
    <div v-bind="{ ...props, ...otherProps }"></div>
    <div v-bind="{ parentProps: props }"></div>
  </div>
</template>

<style scoped>
p {
  color: red;
}
</style>

<script>
console.log("This is the non-setup script");
</script>

<script setup>
import MyComponent from "MyComponent.vue";
import { someConst, otherConst } from "some-module";

let x;

// This comment should be kept

// This comment should also be kept
export function bar(foo) {
  return new Date();
}

const otherProps = {};
</script>
