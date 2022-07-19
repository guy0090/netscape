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
import { Entity } from "@/encounters/objects";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "BossStatus",

  props: {
    boss: Object as PropType<Entity>,
  },

  methods: {
    getBossStatus() {
      // const bossName: number = this.boss?.name;
      const bossMaxHP = this.boss?.maxHp as number;
      const bossCurrentHP = this.boss?.currentHp as number;
      const overkill = bossCurrentHP < 0;
      let percentHp = (bossCurrentHP / bossMaxHP) * 100;
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
