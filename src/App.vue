<template>
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
});
</script>

<style>
html {
  overflow: auto !important;
}

.v-system-bar {
  user-select: none !important;
}

.draggable,
.draggable > * {
  -webkit-app-region: drag;
}

.meter-logo {
  width: 20px !important;
  height: 20px !important;
  -webkit-app-region: drag;
}
</style>
