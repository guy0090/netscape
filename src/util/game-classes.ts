export const getClassName = (id: number): string => {
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
};

export const getClassId = (name: string): number => {
  if (name === "Warrior") return 101;
  if (name === "Mage") return 201;
  if (name === "MartialArtist") return 301;
  if (name === "Assassin") return 401;
  if (name === "Gunner") return 501;
  if (name === "Berserker") return 102;
  if (name === "Destroyer") return 103;
  if (name === "Gunlancer") return 104;
  if (name === "Paladin") return 105;
  if (name === "Arcana") return 202;
  if (name === "Summoner") return 203;
  if (name === "Bard") return 204;
  if (name === "Sorceress") return 205;
  if (name === "Wardancer") return 302;
  if (name === "Scrapper") return 303;
  if (name === "Soulfist") return 304;
  if (name === "Glaivier") return 305;
  if (name === "Glavier") return 305;
  if (name === "Deathblade") return 402;
  if (name === "Shadowhunter") return 403;
  if (name === "Reaper") return 404;
  if (name === "Sharpshooter") return 502;
  if (name === "Deadeye") return 503;
  if (name === "Artillerist") return 504;
  if (name === "Scouter") return 505;
  if (name === "FemaleGunner") return 511;
  if (name === "Gunslinger") return 512;
  if (name === "MaleMartialArtist") return 311;
  if (name === "Striker") return 312;

  return 0;
};
