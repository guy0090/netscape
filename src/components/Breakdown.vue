<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<template>
  <div>
    <v-row class="mt-0 mb-0">
      <v-col class="pe-0 py-0" align-self="center">
        <v-card
          :rounded="0"
          class="bg-red-darken-2"
          v-on:click="tab = 'skills'"
        >
          <v-card-content class="py-1">
            <v-row justify="center">
              <v-col cols="auto" align-self="center"
                ><v-icon icon="mdi-sword"
              /></v-col>
            </v-row>
          </v-card-content>
        </v-card>
      </v-col>
      <v-col class="ps-0 py-0" align-self="center">
        <v-card
          :rounded="0"
          class="bg-indigo-darken-2"
          v-on:click="tab = 'battleItems'"
        >
          <v-card-content class="py-1">
            <v-row justify="center">
              <v-col cols="auto" align-self="center"
                ><v-icon icon="mdi-flask"
              /></v-col>
            </v-row>
          </v-card-content>
        </v-card>
      </v-col>
    </v-row>
    <skill-row
      v-if="tab === 'skills'"
      v-for="skill of getSkills()"
      :key="skill.id"
      :skill="skill"
      :classId="getEntity()?.classId"
      :damageDealt="getEntity()?.stats?.damageDealt"
      :isPaused="isPaused"
      :pausedFor="pausedFor"
      :compact="compact"
      :sessionDuration="sessionDuration"
    />
    <BattleItemRow
      v-else
      v-for="(item, i) of getBattleItems()"
      :key="i"
      :item="item"
    />
  </div>
</template>

<script lang="ts">
import { Entity, Skill } from "@/encounters/objects";
import { defineComponent, ref } from "vue";

// Components
import SkillRow from "./Breakdown/SkillRow.vue";
import BattleItemRow from "./Breakdown/BattleItemRow.vue";

export default defineComponent({
  name: "BreakdownPage",

  components: {
    SkillRow,
    BattleItemRow,
  },

  props: {
    compact: Boolean,
    session: Object,
    sessionDuration: Number,
    isPaused: Boolean,
    pausedFor: Number,
  },

  setup() {
    const tab = ref("skills");

    return {
      tab,
    };
  },

  methods: {
    getEntity(): Entity | undefined {
      const entitiyId = this.$route.params.entityId;
      return this.session?.entities.find(
        (entity: Entity) => entitiyId === entity.id
      );
    },
    getSkills() {
      if (!this.getEntity()?.skills) return [];

      const entitySkills = Object.values(
        this.getEntity()?.skills as Record<string, Skill>
      );

      return entitySkills.sort(
        (a: Skill, b: Skill) => b.stats.damageDealt - a.stats.damageDealt
      );
    },
    getBattleItems() {
      if (!this.getEntity()?.battleItems) return [];
      const battleItems = Object.values(
        this.getEntity()?.battleItems as Record<string, any>
      );

      return battleItems.sort(
        (a: any, b: any) => b.stats.damage - a.stats.damage
      );
    },
  },
});
</script>
