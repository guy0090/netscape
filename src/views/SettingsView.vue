<template>
  <settings-page></settings-page>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import SettingsPage from "@/components/Settings.vue";

export default defineComponent({
  name: "SettingsView",

  props: {
    session: Object,
    compact: Boolean,
    sessionDuration: Number,
    pausedFor: Number,
    isPaused: Boolean,
  },

  components: {
    SettingsPage,
  },
});
</script>
