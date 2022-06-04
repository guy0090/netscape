<template>
  <div class="skills">
    <skill-row
      v-for="skill of getSkills()"
      :key="skill.id"
      :skill="skill"
      :classId="getEntity()?.classId"
      :pausedFor="pausedFor"
      :isPaused="isPaused"
      :damageDealt="getEntity()?.stats?.damageDealt"
      :sessionDuration="sessionDuration"
      :compact="compact"
    >
    </skill-row>
  </div>
</template>

<script lang="ts">
import { Entity, Skill } from "@/bridge/objects";
import { defineComponent } from "vue";

// Components
import SkillRow from "./Breakdown/SkillRow.vue";

export default defineComponent({
  name: "BreakdownPage",

  components: {
    SkillRow,
  },

  props: {
    session: Object,
    compact: Boolean,
    sessionDuration: Number,
    pausedFor: Number,
    isPaused: Boolean,
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
  },
});
</script>
