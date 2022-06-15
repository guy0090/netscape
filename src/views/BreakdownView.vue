<template>
  <breakdown-page></breakdown-page>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import BreakdownPage from "@/components/Breakdown.vue";

export default defineComponent({
  name: "BreakdownView",

  components: {
    BreakdownPage,
  },
});
</script>
