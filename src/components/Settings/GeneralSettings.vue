<template style="height: 100">
  <v-container>
    <v-row class="mb-2 pt-2"> <h3>General Settings</h3> </v-row>
    <v-row class="mb-8"
      ><small>These settings modify the functionality of the app</small></v-row
    >
    <v-row>
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-pause"></v-icon>&nbsp;Pause on Fight End
          <small>&nbsp;(Bosses only)</small></v-row
        >
        <v-row class="mb-3"
          ><small
            >Automatically pauses the meter if the boss dies, the party wipes or
            the phase changes.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="pauseOnPhaseTransition"
          :label="pauseOnPhaseTransition ? 'Pause' : 'Don\'t Pause'"
          color="green-accent-4"
          hide-details
          @change="handlePauseOnPhaseTransition"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-refresh"></v-icon>&nbsp;Reset on Zone Change
        </v-row>
        <v-row class="mb-3"
          ><small
            >Automatically resets the meter if you exit or enter a loading
            screen.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="resetOnZoneChange"
          :label="resetOnZoneChange ? 'Reset' : 'Don\'t Reset'"
          color="green-accent-4"
          hide-details
          @change="handleResetOnZoneChange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-incognito"></v-icon>&nbsp;Anonymize Player Names
        </v-row>
        <v-row class="mb-3"
          ><small
            >Toggle between showing player names or class names.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="anonymizeMeter"
          :label="anonymizeMeter ? 'Class Names' : 'Player Names'"
          color="green-accent-4"
          hide-details
          @change="handleAnonymizeChange"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-2"
          ><v-icon icon="mdi-filter-outline"></v-icon>&nbsp;Remove Overkill
          Damage
        </v-row>
        <v-row class="mb-3"
          ><small
            >Toggle between removing damage that would do more than the boss has
            remaining HP</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="removeOverkillDamage"
          :label="removeOverkillDamage ? 'Remove' : 'Keep'"
          color="green-accent-4"
          hide-details
          @change="handleRemoveOverkillDamage"
        ></v-switch>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { mapActions } from "vuex";

export default defineComponent({
  name: "GeneralSettings",

  setup() {
    let pauseOnPhaseTransition = ref(true);
    let resetOnZoneChange = ref(true);
    let anonymizeMeter = ref(false);
    let removeOverkillDamage = ref(true);

    return {
      pauseOnPhaseTransition,
      resetOnZoneChange,
      anonymizeMeter,
      removeOverkillDamage,
    };
  },

  mounted() {
    this.applySettings();
    this.listenForChanges();
  },

  methods: {
    ...mapActions(["updateSetting", "getSetting"]),
    applySettings() {
      this.getSetting("pauseOnPhaseTransition")
        .then((d: { message: { value: boolean } }) => {
          this.pauseOnPhaseTransition = d.message.value;
        })
        .catch((err: Error) => {
          console.error(err);
        });

      this.getSetting("resetOnZoneChange")
        .then((d: { message: { value: boolean } }) => {
          this.resetOnZoneChange = d.message.value;
        })
        .catch((err: Error) => {
          console.error(err);
        });

      this.getSetting("anonymizeMeter")
        .then((d: { message: { value: boolean } }) => {
          this.anonymizeMeter = d.message.value;
        })
        .catch((err: Error) => {
          console.error(err);
        });

      this.getSetting("removeOverkillDamage")
        .then((d: { message: { value: boolean } }) => {
          this.removeOverkillDamage = d.message.value;
        })
        .catch((err: Error) => {
          console.error(err);
        });
    },
    listenForChanges() {
      (window as any).ipcBridge.receive("fromMain", (data: any) => {
        const { event, message } = data;
        if (event === "new-setting") {
          const { setting, value } = message;
          switch (setting) {
            case "pauseOnPhaseTransition":
              this.pauseOnPhaseTransition = value;
              break;
            case "resetOnZoneChange":
              this.resetOnZoneChange = value;
              break;
            case "anonymizeMeter":
              this.anonymizeMeter = value;
              break;
            case "removeOverkillDamage":
              this.removeOverkillDamage = value;
              break;
            default:
              break;
          }
        }
      });
    },
    handlePauseOnPhaseTransition() {
      this.updateSetting({
        key: "pauseOnPhaseTransition",
        value: this.pauseOnPhaseTransition,
      });
    },
    handleResetOnZoneChange() {
      this.updateSetting({
        key: "resetOnZoneChange",
        value: this.resetOnZoneChange,
      });
    },
    handleAnonymizeChange() {
      this.updateSetting({
        key: "anonymizeMeter",
        value: this.anonymizeMeter,
      });
    },
    handleRemoveOverkillDamage() {
      this.updateSetting({
        key: "removeOverkillDamage",
        value: this.removeOverkillDamage,
      });
    },
  },
});
</script>
