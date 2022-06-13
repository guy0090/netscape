<template>
  <v-card :rounded="0" class="settings-bg">
    <v-tabs
      fixed-tabs
      show-arrows
      density="compact"
      v-model="tab"
      background-color="blue-darken-3"
    >
      <v-tab value="0">General</v-tab>
      <v-tab value="1">Appearance</v-tab>
      <v-tab value="2">Uploads</v-tab>
    </v-tabs>

    <v-card-content class="py-1 px-0">
      <v-window v-model="tab">
        <v-window-item value="0">
          <general-settings class="ps-6 pe-5"></general-settings>
        </v-window-item>
        <v-window-item value="1"
          ><appearance-settings class="ps-6 pe-5"></appearance-settings
        ></v-window-item>
        <v-window-item value="2">
          <upload-settings class="ps-6 pe-5"></upload-settings>
        </v-window-item>
      </v-window>
    </v-card-content>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Components
import GeneralSettings from "@/components/Settings/GeneralSettings.vue";
import AppearanceSettings from "@/components/Settings/AppearanceSettings.vue";
import UploadSettings from "@/components/Settings/UploadSettings.vue";

export default defineComponent({
  name: "SettingPage",

  components: {
    GeneralSettings,
    AppearanceSettings,
    UploadSettings,
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
