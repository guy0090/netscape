<template>
  <v-app theme="dark">
    <!-- 2,916,905,456 -->
    <v-main>
      <v-container fluid class="px-3 pt-3 pb-0 bar">
        <v-row class="draggable bar">
          <v-col class="pa-0">
            <v-progress-linear
              :model-value="currentBarPercent"
              :height="$vuetify.display.height"
              :color="barColor"
              rounded="sm"
            >
              <v-row justify="space-between">
                <v-col class="ms-2" cols="auto">
                  <span>x{{ currentBars }}</span>
                </v-col>
                <v-col cols="auto" class="align-self-center">
                  <v-row justify="center" align="center">
                    <span style="color: white !important">
                      {{ new Intl.NumberFormat().format(currentHp) }}/{{
                        new Intl.NumberFormat().format(maxHp)
                      }}</span
                    >
                    <span class="ms-1" style="color: lightgrey; font-size: 10pt"
                      >{{ ((currentHp / maxHp) * 100).toFixed(2) }}%</span
                    >
                  </v-row>
                  <v-row
                    class="mt-1"
                    justify="center"
                    align="center"
                    v-if="$vuetify.display.height >= 40 && bossName.length > 0"
                  >
                    <span>{{ bossName }}</span>
                  </v-row>
                </v-col>
                <v-col class="me-2" cols="auto">
                  <span style="color: white !important"
                    >x{{ currentBars }}</span
                  >
                </v-col>
              </v-row>
            </v-progress-linear>
          </v-col>
        </v-row>
        <!-- <v-row hidden class="mt-4">Debuffs</v-row> -->
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "HPBar",

  async mounted() {
    this.applySettings();
    this.listenForChanges();
  },

  setup() {
    const bars = ref(0);
    const barSize = ref(0);
    const barColor = ref("#b71c1c");
    const currentBars = ref(1);
    const maxHp = ref(1);
    const currentHp = ref(1);
    const currentBarPercent = ref(100);
    const currentBarHp = ref(0);
    const bossName = ref("");
    // const inter = ref({} as ReturnType<typeof setInterval> | undefined);

    return {
      bars,
      barSize,
      barColor,
      currentBars,
      maxHp,
      currentHp,
      currentBarPercent,
      currentBarHp,
      bossName,
    };
  },

  methods: {
    resetBar() {
      this.bars = 0;
      this.barSize = 0;
      this.currentBars = 1;
      this.maxHp = 1;
      this.currentHp = 1;
      this.currentBarPercent = 100;
      this.currentBarHp = 0;
      this.bossName = "";
    },
    getCurrentBarPercent(damageDealt: number) {
      this.currentHp -= damageDealt;
      const diff = this.currentBarHp - damageDealt;
      this.currentBarHp -= damageDealt;

      if (diff < 0) {
        this.currentBars--;
        this.currentBarHp = this.barSize + diff;

        if (this.currentBarHp < 0) {
          const portion = Math.abs(this.currentBarHp) / this.barSize;
          const extraBars = Math.ceil(portion);
          const newSize = this.barSize * portion;

          this.currentBars = this.currentBars - extraBars;
          this.currentBarHp = this.barSize - newSize;
        }
      }

      if (this.currentBars <= 0) {
        this.currentBars = 0;
        this.currentBarPercent = 0;
        return;
      }

      const newPercent = (this.currentBarHp / this.barSize) * 100;
      this.currentBarPercent = newPercent;
    },
    async getSetting(setting: string) {
      try {
        const { message } = await (window as any).ipcBridge.invoke("toMain", {
          message: "get-setting",
          setting: setting,
        });
        return message.value;
      } catch (err) {
        return null;
      }
    },
    applySettings() {
      this.getSetting("hpBarColor")
        .then((color) => {
          this.barColor = color;
        })
        .catch((err) => {
          console.warn("Fallback to default color", err);
        });
    },
    listenForChanges() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ipcBridge.receive("fromMain", (data: any) => {
        const { event, message } = data;
        if (event === "new-setting") {
          const { setting, value } = message;
          switch (setting) {
            case "hpBarColor":
              this.barColor = value;
              break;
            default:
              break;
          }
        } else if (event === "init-enc") {
          this.resetBar();
          const { bars, currentHp, maxHp, bossName } = message;

          this.bars = bars;
          this.currentBars = bars;

          this.currentHp = currentHp;
          this.maxHp = maxHp;
          this.bossName = bossName;

          this.barSize = this.maxHp / this.bars;
          this.currentBarHp = this.barSize;
        } else if (event === "end-enc") {
          this.resetBar();
        } else if (event === "boss-damaged") {
          const { damageDealt } = message;

          this.getCurrentBarPercent(damageDealt);
        }
      });
    },
  },
});
</script>

<style scoped>
.bar {
  height: 100% !important;
}
</style>
