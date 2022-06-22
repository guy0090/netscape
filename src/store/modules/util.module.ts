import { Module } from "vuex";

/**
 * Module containing resources and utilities.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const util: Module<any, any> = {
  state: () => ({}),
  getters: {
    getClassName: (state) => (id: number) => {
      if (id === 101) return "Warrior";
      if (id === 201) return "Mage";
      if (id === 301) return "MartialArtist";
      if (id === 401) return "Assassin";
      if (id === 501) return "Gunner";
      if (id === 102) return "Berserker";
      if (id === 103) return "Destroyer";
      if (id === 104) return "Gunlancer";
      if (id === 105) return "Paladin";
      if (id === 202) return "Arcana";
      if (id === 203) return "Summoner";
      if (id === 204) return "Bard";
      if (id === 205) return "Sorceress";
      if (id === 302) return "Wardancer";
      if (id === 303) return "Scrapper";
      if (id === 304) return "Soulfist";
      if (id === 305) return "Glavier";
      if (id === 402) return "Deathblade";
      if (id === 403) return "Shadowhunter";
      if (id === 404) return "Reaper";
      if (id === 502) return "Sharpshooter";
      if (id === 503) return "Deadeye";
      if (id === 504) return "Artillerist";
      if (id === 505) return "Scouter"; // Machinist?
      if (id === 511) return "FemaleGunner";
      if (id === 512) return "Gunslinger";
      if (id === 311) return "MaleMartialArtist";
      if (id === 312) return "Striker";

      return "UnknownClass";
    },
  },
};
