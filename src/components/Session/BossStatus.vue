<template>
  <v-progress-linear
    :model-value="getBossStatus().percent"
    height="25"
    color="red"
  >
    <span style="color: white !important">{{ getBossStatus().status }}</span>
  </v-progress-linear>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BossStatus",

  props: {
    boss: Object,
  },

  methods: {
    getBossStatus() {
      // const bossName: number = this.boss?.name;
      const bossMaxHP: number = this.boss?.maxHp;
      const bossCurrentHP: number = this.boss?.currentHp;
      const overkill: boolean = bossCurrentHP < 0;
      let percentHp: number = (bossCurrentHP / bossMaxHP) * 100;
      let status = `${bossCurrentHP}/${bossMaxHP} (${percentHp.toFixed(2)}%)`;
      if (overkill) {
        status = `${0} (${bossCurrentHP})/${bossMaxHP} (0%)`;
        percentHp = 0;
      }

      return {
        status,
        percent: percentHp,
      };
    },
  },
});
</script>
