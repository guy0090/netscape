<template>
  <div class="skills">
    <skill-row
      v-for="skill of getSkills()"
      :key="skill.id"
      :skill="skill"
      :classId="getEntity()?.classId"
      :damageDealt="getEntity()?.stats?.damageDealt"
      :isPaused="isPaused"
      :pausedFor="pausedFor"
      :compact="compact"
      :sessionDuration="sessionDuration"
    >
    </skill-row>
  </div>
</template>

<script lang="ts">
import { Entity, Skill } from "@/encounters/objects";
import { defineComponent } from "vue";

// Components
import SkillRow from "./Breakdown/SkillRow.vue";

export default defineComponent({
  name: "BreakdownPage",

  components: {
    SkillRow,
  },

  props: {
    compact: Boolean,
    session: Object,
    sessionDuration: Number,
    isPaused: Boolean,
    pausedFor: Number,
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
