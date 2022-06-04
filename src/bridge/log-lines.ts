/* eslint-disable @typescript-eslint/no-unused-vars */
import { tryParseInt } from "./parser";
import { ENTITY_TYPE } from "./objects";

export const LINE_SPLIT_CHAR = "|";

// logId = 0
export class LogMessage {
  timestamp: number;
  message: string | unknown;
  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.message = lineSplit[2];
  }
}

// logId = 1
export class LogInitEnv {
  timestamp: number;
  playerId: string;
  playerName: string;
  playerGearLevel: string;

  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.playerId = lineSplit[2];
    this.playerName = lineSplit[3];
    this.playerGearLevel = lineSplit[4];
  }
}

export enum RAID_RESULT {
  END = 0, // Raid ended; Not sure when it procs
  DEAD = 1, // Guardian died; Also procs on every Argos phase
  WIPE = 2, // Non-guardian boss died; Party wiped (does not proc on guardian wipes)
}

// logId = 2
export class LogPhaseTransition {
  timestamp: number;
  raidResultType: RAID_RESULT;

  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    const type = tryParseInt(lineSplit[2]);

    console.log("PhaseLine", lineSplit);
    switch (type) {
      case 0:
        this.raidResultType = RAID_RESULT.END;
        break;
      case 1:
        this.raidResultType = RAID_RESULT.DEAD;
        break;
      case 2:
        this.raidResultType = RAID_RESULT.WIPE;
        break;
      default:
        this.raidResultType = RAID_RESULT.END;
        break;
    }
  }
}

// logId = 3
export class LogNewPc {
  timestamp: number;
  id: string;
  name: string;
  classId: number;
  class: string;
  level: number;
  gearLevel: string;
  currentHp: number;
  maxHp: number;
  type: ENTITY_TYPE;

  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.classId = tryParseInt(lineSplit[4]);
    this.class = lineSplit[5] || "Unknown Class";
    this.level = tryParseInt(lineSplit[6]);
    this.gearLevel = lineSplit[7];
    this.currentHp = tryParseInt(lineSplit[8]);
    this.maxHp = tryParseInt(lineSplit[9]);
    this.type = ENTITY_TYPE.PLAYER;
  }
}

// logId = 4
export class LogNewNpc {
  timestamp: number;
  id: string;
  npcId: number;
  name: string;
  currentHp: number;
  maxHp: number;
  type: ENTITY_TYPE;

  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.npcId = tryParseInt(lineSplit[3]);
    this.name = lineSplit[4] || "Unknown Entity";
    this.currentHp = tryParseInt(lineSplit[5]);
    this.maxHp = tryParseInt(lineSplit[6]);
    this.type = ENTITY_TYPE.UNKNOWN;
  }
}

// logId = 5
export class LogDeath {
  public timestamp: number;
  public id: string;
  public name: string;
  public killerId: string;
  public killerName: string;

  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.killerId = lineSplit[4];
    this.killerName = lineSplit[5] || "Unknown Entity";
  }
}

// logId = 6
export class LogSkillStart {
  constructor(lineSplit: string[]) {
    // TODO:
  }
}

// logId = 7
export class LogSkillStage {
  constructor(lineSplit: string[]) {
    // TODO:
  }
}

// logId = 8
export class LogDamage {
  timestamp: number;
  sourceId: string;
  sourceName: string;
  skillId: number;
  skillName: string;
  skillEffectId: number;
  skillEffect: string;
  targetId: string;
  targetName: string;
  damage: number;
  damageModifier: boolean;
  isCrit: boolean;
  isBackAttack: boolean;
  isFrontAttack: boolean;
  currentHp: number;
  maxHp: number;
  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.sourceId = lineSplit[2];
    this.sourceName = lineSplit[3] || "Unknown Entity";
    this.skillId = tryParseInt(lineSplit[4]);
    this.skillName = lineSplit[5] || "Unknown Skill";
    this.skillEffectId = tryParseInt(lineSplit[6]);
    this.skillEffect = lineSplit[7];
    this.targetId = lineSplit[8];
    this.targetName = lineSplit[9] || "Unknown Entity";
    this.damage = tryParseInt(lineSplit[10]);
    this.damageModifier = lineSplit[11] === "1";
    this.isCrit = lineSplit[12] === "1";
    this.isBackAttack = lineSplit[13] === "1";
    this.isFrontAttack = lineSplit[14] === "1";
    this.currentHp = tryParseInt(lineSplit[15]);
    this.maxHp = tryParseInt(lineSplit[16]);
  }
}

// logId = 9
export class LogHeal {
  timestamp: number;
  id: string;
  name: string;
  healAmount: number;
  currentHp: number;
  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    this.healAmount = tryParseInt(lineSplit[4]);
    this.currentHp = tryParseInt(lineSplit[5]);
  }
}

// logId = 10
export class LogBuff {
  constructor(lineSplit: string[]) {
    // TODO:
  }
}

// logId = 11
export class LogCounterAttack {
  timestamp: number;
  id: string;
  name: string;
  constructor(lineSplit: string[]) {
    this.timestamp = +new Date(lineSplit[1]);
    this.id = lineSplit[2];
    this.name = lineSplit[3] || "Unknown Entity";
    /* this.targetId = lineSplit[4];
    this.targetName = lineSplit[5] || "Unknown Entity"; */
  }
}
