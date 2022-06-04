<template>
  <v-card :rounded="0" class="settings-bg">
    <v-tabs
      fixed-tabs
      show-arrows
      density="compact"
      v-model="tab"
      background-color="blue-darken-3"
    >
      <v-tab value="1">General</v-tab>
      <v-tab value="2">Appearance</v-tab>
    </v-tabs>

    <v-card-content class="py-1 px-0">
      <v-window v-model="tab">
        <v-window-item class="mx-3" value="1">
          <general-settings></general-settings>
        </v-window-item>
        <v-window-item class="mx-3" value="2"
          ><appearance-settings></appearance-settings
        ></v-window-item>
      </v-window>
    </v-card-content>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import GeneralSettings from "@/components/Settings/GeneralSettings.vue";
import AppearanceSettings from "@/components/Settings/AppearanceSettings.vue";

export default defineComponent({
  name: "SettingPage",

  components: {
    GeneralSettings,
    AppearanceSettings,
  },

  data() {
    let tab = "1";
    return {
      tab,
    };
  },
});
</script>

<style scoped>
.settings-bg {
  background: rgb(18, 18, 18) !important;
  height: 100% !important;
}
</style>
