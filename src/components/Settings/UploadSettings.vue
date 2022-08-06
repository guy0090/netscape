<template style="height: 100">
  <v-container>
    <v-row class="mb-2 mt-1"> <h3>Upload Settings</h3> </v-row>
    <v-row class="mb-8"
      ><small>These settings allow you to modify log uploads </small>
    </v-row>
    <v-row>
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-3"
          ><v-icon icon="mdi-cloud-upload-outline"></v-icon>&nbsp;Toggle Upload
          Button
        </v-row>
        <v-row class="mb-3"
          ><small>Hides or shows the upload toggle button.</small></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="showUploadButton"
          :label="showUploadButton ? 'Show' : 'Hide'"
          color="green-accent-4"
          hide-details
          @change="handleShowUploadButton"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-3"
          ><v-icon icon="mdi-export-variant"></v-icon>&nbsp;Open In Browser
        </v-row>
        <v-row class="mb-3"
          ><small
            >If set to "Open", the uploaded log will automatically be opened in
            your default browser.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="openInBrowserOnUpload"
          :label="openInBrowserOnUpload ? 'Open' : 'Don\'t Open'"
          color="green-accent-4"
          hide-details
          @change="handleOpenInBrowserButton"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-3">
          <v-icon v-if="uploadLogs" icon="mdi-cloud-check-outline"></v-icon>
          <v-icon v-else icon="mdi-cloud-off-outline"></v-icon>
          &nbsp;Upload Logs
        </v-row>
        <v-row class="mb-3"
          ><small>Whether to upload generated logs.</small></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="uploadLogs"
          :label="uploadLogs ? 'Upload' : 'Don\'t Upload'"
          color="green-accent-4"
          hide-details
          :disabled="uploadKey.length !== 32"
          @change="handleUploadLogsButton"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="pb-0">
        <v-row class="mb-3">
          <v-icon icon="mdi-incognito"></v-icon>
          &nbsp;Upload Unlisted
        </v-row>
        <v-row class="mb-3"
          ><small
            >If set, uploaded logs will only be visible to you.</small
          ></v-row
        >
      </v-col>
      <v-spacer></v-spacer>
      <v-col class="mb-0 pb-0 pt-0 mt-0" cols="auto">
        <v-switch
          v-model="uploadUnlisted"
          :label="uploadUnlisted ? 'Unlisted' : 'Public'"
          color="green-accent-4"
          hide-details
          @change="handleUploadUnlistedButton"
        ></v-switch>
      </v-col>
    </v-row>
    <v-row class="mt-5">
      <v-col cols="auto" class="mb-2"
        ><v-row class="mb-3"
          ><v-icon icon="mdi-key-outline"></v-icon>&nbsp;Upload Key
        </v-row>
        <v-row
          ><small
            >To upload a session you need an API key. You can get one by logging
            in
            <span
              class="text-blue-accent-3"
              style="cursor: pointer"
              @click="openRegisterUrl()"
              >here</span
            >.</small
          ></v-row
        ></v-col
      >
      <v-col class="pt-0">
        <v-text-field
          v-model="uploadKey"
          label="API Key"
          variant="outlined"
          :rules="[(v) => v.length === 32 || 'Min Length: 32']"
          counter
          maxlength="32"
          hint="An API key must be exactly 32 characters long."
          clearable
          clear-icon="mdi-delete"
          :type="showUploadKey ? 'text' : 'password'"
          :append-icon="showUploadKey ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append="showUploadKey = !showUploadKey"
          @update:model-value="handleUploadKeyChange"
        >
        </v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { mapActions } from "vuex";

export default defineComponent({
  name: "UploadSettings",

  mounted() {
    this.applySettings();
    this.listenForChanges();
  },

  methods: {
    ...mapActions([
      "openUrl",
      "updateSetting",
      "getSetting",
      "getApiKey",
      "setApiKey",
      "debug",
      "error",
    ]),
    applySettings() {
      this.getSetting("showUploadButton")
        .then((d: { message: { value: boolean } }) => {
          this.showUploadButton = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("openInBrowserOnUpload")
        .then((d: { message: { value: boolean } }) => {
          this.openInBrowserOnUpload = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("uploadLogs")
        .then((d: { message: { value: boolean } }) => {
          this.uploadLogs = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getSetting("uploadUnlisted")
        .then((d: { message: { value: boolean } }) => {
          this.uploadUnlisted = d.message.value;
        })
        .catch((err: Error) => {
          this.error(err);
        });

      this.getApiKey()
        .then((d: { message: { value: string } }) => {
          const key = d.message.value;
          if (key && key.length === 32) {
            this.uploadKey = key;
          } else {
            this.updateSetting({ key: "uploadLogs", value: false })
              .then(() => {
                this.debug("Upload logs disabled");
                this.uploadLogs = false;
              })
              .catch((err) => {
                this.error(`Error updating uploadLogs:`, err);
              });
          }
        })
        .catch((err) => {
          this.error(err);
        });
    },
    listenForChanges() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ipcBridge.receive("fromMain", (data: any) => {
        const { event, message } = data;
        if (event === "new-setting") {
          const { setting, value } = message;
          switch (setting) {
            case "showUploadButton":
              if (this.showUploadButton !== value) {
                this.showUploadButton = value;
              }
              break;
            case "openInBrowserOnUpload":
              if (this.openInBrowserOnUpload !== value) {
                this.openInBrowserOnUpload = value;
              }
              break;
            case "uploadLogs":
              if (this.uploadLogs !== value) {
                this.uploadLogs = value;
              }
              break;
            case "uploadUnlisted":
              if (this.uploadUnlisted !== value) {
                this.uploadUnlisted = value;
              }
              break;
            default:
              break;
          }
        }
      });
    },
    openRegisterUrl() {
      this.openUrl(process.env.VUE_APP_LOGS_URL);
    },
    handleShowUploadButton() {
      this.updateSetting({
        key: "showUploadButton",
        value: this.showUploadButton,
      });
    },
    handleOpenInBrowserButton() {
      this.updateSetting({
        key: "openInBrowserOnUpload",
        value: this.openInBrowserOnUpload,
      });
    },
    handleUploadLogsButton() {
      this.updateSetting({
        key: "uploadLogs",
        value: this.uploadLogs,
      });
    },
    handleUploadUnlistedButton() {
      this.updateSetting({
        key: "uploadUnlisted",
        value: this.uploadUnlisted,
      });
    },
    handleUploadKeyChange(val: string) {
      if (val.length !== 32 && this.uploadLogs !== false) {
        this.updateSetting({
          key: "uploadLogs",
          value: false,
        })
          .then(() => {
            this.uploadLogs = false;
          })
          .catch((err) => {
            this.error(`Error updating uploadLogs:`, err);
          });
      }

      this.setApiKey(val).catch((err) => {
        this.error(`Error updating upload key:`, err);
      });
    },
  },

  setup() {
    let showUploadButton = ref(true);
    let openInBrowserOnUpload = ref(false);
    let uploadLogs = ref(false);
    let uploadUnlisted = ref(true);
    let uploadKey = ref("");
    let showUploadKey = ref(false);

    return {
      showUploadButton,
      openInBrowserOnUpload,
      uploadLogs,
      uploadUnlisted,
      uploadKey,
      showUploadKey,
    };
  },
});
</script>
