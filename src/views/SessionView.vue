<template>
  <session-page></session-page>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import SessionPage from "../components/Session.vue";

export default defineComponent({
  name: "SessionView",

  components: {
    SessionPage,
  },
});
</script>
