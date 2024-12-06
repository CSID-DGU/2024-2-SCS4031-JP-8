<template>
  <svg
    :class="[
      'w-5 h-5 transform transition-transform duration-200',
      { 'rotate-180': isExpanded }
    ]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style="background-color: transparent"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M19 9l-7 7-7-7"
    ></path>
  </svg>
</template>

<script setup>
defineProps({
  isExpanded: {
    type: Boolean,
    default: false
  }
})
</script>
