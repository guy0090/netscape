<template>
  <breakdown-page :session="session" :compact="compact"></breakdown-page>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import BreakdownPage from "@/components/Breakdown.vue";

export default defineComponent({
  name: "BreakdownView",
  props: {
    session: Object || {},
    compact: Boolean || false,
  },
  components: {
    BreakdownPage,
  },
});
</script>
