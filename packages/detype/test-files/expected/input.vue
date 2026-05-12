<template>
  <div>
    <p>Hello {{ someConst }}!</p>
    <MyComponent v-bind:prop="someConst" v-custom:[someConst]="otherConst" />
    <div v-bind="{ ...props }" :array="[...arr1]"></div>
    <div v-bind="{ ...props, ...otherProps }" :array="[...arr1, ...arr2]"></div>
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

const props = defineProps({
  prop: { type: String, required: true },
  array: { type: Array, required: true },
});

const emit = defineEmits(["change", "update"]);

let x;

// This comment should be kept

// This comment should also be kept
defineExpose({
  foo: "bar",
});
const otherProps = {};
const arr1 = [];
const arr2 = [];
</script>
