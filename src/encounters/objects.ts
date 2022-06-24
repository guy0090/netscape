import { v4 as uuidv4 } from "uuid";

export enum ENTITY_TYPE {
  UNKNOWN = -1,
  MONSTER = 0,
  BOSS = 1,
  GUARDIAN = 2,
  PLAYER = 3,
}

export class Session {
  public id: string;
  public paused: boolean;
  public live: boolean;
  public firstPacket: number;
  public lastPacket: number;
  public entities: Entity[];
  public damageStatistics: DamageStatistics;

  constructor(session?: {
    id?: string;
    paused?: boolean;
    live?: boolean;
    firstPacket?: number;
    lastPacket?: number;
    duration?: number;
    entities?: Entity[];
    damageStatistics?: DamageStatistics;
  }) {
    this.id = session?.id || uuidv4();
    this.paused = session?.paused || false;
    this.live = session?.live || true;
    this.firstPacket = session?.firstPacket || 0;
    this.lastPacket = session?.lastPacket || 0;
    this.entities = session?.entities || [];
    this.damageStatistics = session?.damageStatistics || new DamageStatistics();
  }

  cleanEntities(
    entityFilter: ENTITY_TYPE[] | undefined = [
      ENTITY_TYPE.GUARDIAN,
      ENTITY_TYPE.BOSS,
      ENTITY_TYPE.PLAYER,
    ]
  ) {
    // Filter out entities not in the filter list
    if (entityFilter) {
      this.entities = this.entities.filter((e) =>
        entityFilter?.includes(e.type)
      );
    }

    /* TODO: Decide if this is necessary
    // If multiple bosses are logged, only keep the most recent one
    const bosses = this.entities.filter(
      (e) => e.type === ENTITY_TYPE.BOSS || e.type === ENTITY_TYPE.GUARDIAN
    );

    if (bosses.length > 1) {
      const filtered = bosses
        .sort((a, b) => b.lastUpdate - a.lastUpdate)
        .slice(1)
        .map((e) => e.id);

      this.entities = this.entities.filter((e) => !filtered.includes(e.id));
    }
    */
  }

  getDps() {
    const duration = (this.lastPacket - this.firstPacket) / 1000;
    const damage = this.entities.reduce(
      (acc, e) => acc + e.stats.damageDealt,
      0
    );
    return damage / duration;
  }

  toSimpleObject() {
    return new SimpleSession(this);
  }
}

export class DamageStatistics {
  public totalDamageDealt: number;
  public totalDamageTaken: number;
  public topDamageDealt: number;
  public topDamageTaken: number;
  public dps: number;

  public constructor(damageStatistics?: {
    totalDamageDealt?: number;
    totalDamageTaken?: number;
    topDamageDealt?: number;
    topDamageTaken?: number;
    dps?: number;
  }) {
    this.totalDamageDealt = damageStatistics?.totalDamageDealt || 0;
    this.totalDamageTaken = damageStatistics?.totalDamageTaken || 0;
    this.topDamageDealt = damageStatistics?.topDamageDealt || 0;
    this.topDamageTaken = damageStatistics?.topDamageTaken || 0;
    this.dps = damageStatistics?.dps || 0;
  }
}

export class Entity {
  public lastUpdate: number;
  public id: string;
  public npcId: string;
  public name: string;
  public type: ENTITY_TYPE;
  public class: string;
  public classId: number;
  public level: number;
  public gearLevel: number;
  public currentHp: number;
  public maxHp: number;
  public skills: { [key: string]: Skill };
  public stats: Stats;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(entity: Record<string, any>) {
    this.lastUpdate = entity.lastUpdate || +new Date();
    this.id = entity.id;
    this.npcId = entity.npcId;
    this.name = entity.name;
    this.type = entity.type;
    this.class = entity.class;
    this.classId = entity.classId || 0;
    this.level = entity.level || 0;
    this.gearLevel = entity.gearLevel || 0;
    this.currentHp = entity.currentHp || 0;
    this.maxHp = entity.maxHp || 0;
    this.skills = entity.skills || {};
    this.stats = new Stats(entity.stats);
  }

  addSkill(id: number, content: Skill) {
    this.skills[id] = content;
  }
}

export class Stats {
  public hits: number;
  public crits: number;
  public backHits: number;
  public frontHits: number;
  public counters: number;
  public damageDealt: number;
  public healing: number;
  public damageTaken: number;
  public deaths: number;
  public dps: number;

  constructor(stats?: { [key: string]: number }) {
    this.hits = stats?.hits || 0;
    this.crits = stats?.crits || 0;
    this.backHits = stats?.backHits || 0;
    this.frontHits = stats?.frontHits || 0;
    this.counters = stats?.counters || 0;
    this.damageDealt = stats?.damageDealt || 0;
    this.healing = stats?.healing || 0;
    this.damageTaken = stats?.damageTaken || 0;
    this.deaths = stats?.deaths || 0;
    this.dps = stats?.dps || 0;
  }
}

export class Skill {
  public id: number;
  public name: string;
  public breakdown: SkillBreakdown[];
  public stats: SkillStats;

  constructor(skill: {
    id: number;
    name?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    breakdown?: Record<string, any>;
    stats?: Record<string, number>;
  }) {
    this.id = skill.id;
    this.name = skill.name || "Unknown Skill";
    this.breakdown =
      skill.breakdown?.map(
        (breakdown: {
          timestamp: number;
          damage: number;
          isCrit: boolean;
          isBackHit: boolean;
          isFrontHit: boolean;
          targetEntity: string;
          isCounter?: boolean | undefined;
        }) => new SkillBreakdown(breakdown)
      ) || [];
    this.stats = new SkillStats(skill?.stats);
  }
}

export class SkillBreakdown {
  public timestamp: number;
  public damage: number;
  public isCrit: boolean;
  public isBackHit: boolean;
  public isFrontHit: boolean;
  public targetEntity: string;
  public isCounter: boolean;

  constructor(breakdown: {
    timestamp: number;
    damage: number;
    isCrit: boolean;
    isBackHit: boolean;
    isFrontHit: boolean;
    targetEntity: string;
    isCounter?: boolean;
  }) {
    this.timestamp = breakdown.timestamp;
    this.damage = breakdown.damage;
    this.isCrit = breakdown.isCrit;
    this.isBackHit = breakdown.isBackHit;
    this.isFrontHit = breakdown.isFrontHit;
    this.targetEntity = breakdown.targetEntity;
    this.isCounter = breakdown.isCounter || false;
  }
}

export class SkillStats {
  public hits: number;
  public crits: number;
  public backHits: number;
  public frontHits: number;
  public counters: number;
  public damageDealt: number;
  public topDamage: number;

  constructor(stats?: Record<string, number>) {
    this.hits = stats?.hits || 0;
    this.crits = stats?.crits || 0;
    this.backHits = stats?.backHits || 0;
    this.frontHits = stats?.frontHits || 0;
    this.counters = stats?.counters || 0;
    this.damageDealt = stats?.damageDealt || 0;
    this.topDamage = stats?.topDamage || 0;
  }
}

export class SimpleSession {
  public paused: boolean;
  public live: boolean;
  public firstPacket: number;
  public lastPacket: number;
  public entities: SimpleEntity[];
  public damageStatistics: DamageStatistics;

  constructor(session: Session) {
    this.paused = session.paused || false;
    this.live = session.live || false;
    this.firstPacket = session.firstPacket || 0;
    this.lastPacket = session.lastPacket || 0;
    this.entities = session.entities.map((entity) => new SimpleEntity(entity));
    this.damageStatistics = session.damageStatistics;
  }
}

export class SimpleEntity {
  public lastUpdate: number;
  public id: string;
  public npcId?: string;
  public name: string;
  public type: ENTITY_TYPE;
  public classId: number;
  public gearLevel: string;
  public currentHp: number;
  public maxHp: number;
  public skills: SimpleSkill[];
  public stats: Stats;

  constructor(entity: Entity) {
    this.lastUpdate = entity.lastUpdate;
    this.id = entity.id;
    this.npcId = entity.npcId;
    this.name = entity.name;
    this.type = entity.type;
    this.classId = entity.classId;
    this.gearLevel = entity.gearLevel.toFixed(2).replaceAll(".", ",");
    this.currentHp = entity.currentHp;
    this.maxHp = entity.maxHp;
    this.skills = Object.values(entity.skills).map(
      (skill) => new SimpleSkill(skill)
    );
    this.stats = entity.stats;
  }
}

export class SimpleSkill {
  public id: number;
  public name: string;
  public stats: SkillStats;

  constructor(skill: Skill) {
    this.id = skill.id;
    this.name = skill.name;
    this.stats = skill.stats;
  }
}
