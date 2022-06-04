<template>
  <session-page :session="session" :compact="compact" />
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import SessionPage from "../components/Session.vue";

export default defineComponent({
  name: "SessionView",

  props: {
    session: Object || {},
    compact: Boolean || false,
  },

  components: {
    SessionPage,
  },
});
</script>
