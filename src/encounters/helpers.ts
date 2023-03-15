import os from "os";
import fs from "fs";
import ms from "ms";
import _ from "lodash";
import { glob, globSync } from "glob";
import { logger } from "@/util/logging";
import { Entity, Session } from "./objects";
import { Brotli, Gzip } from "@/util/compression";
import { getClassName } from "@/util/game-classes";
import { getClassIdFromSkillId } from "@/util/skills";
import { EntityType } from "@/bridge/log-lines";

export const USER_HOME_DIR = os.homedir();
export const ENCOUNTER_DIR = `${USER_HOME_DIR}\\Documents\\Netscape\\Encounters`;

export const encounterDirExists = async (create = false) => {
  try {
    const dir = await fs.promises.stat(ENCOUNTER_DIR);
    return dir.isDirectory();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      if (create) {
        await fs.promises.mkdir(ENCOUNTER_DIR, { recursive: true });
        return true;
      }
    }
    return false;
  }
};

/**
 * Save an encounter to file. If not in debug mode, will only save encounters
 * that are longer than 1 minute.
 */
export const saveEncounter = async (
  encounter: Session,
  compress = true,
  compressWith = "gzip",
  debug = false
) => {
  try {
    await encounterDirExists(true);
    const name = getNewEncounterName(encounter);
    const file = `${ENCOUNTER_DIR}\\${name}`;
    const data = JSON.stringify(encounter);

    const encounterDuration = encounter.lastPacket - encounter.firstPacket;

    if (debug) {
      const now = new Date();
      const compressed =
        compressWith === "gzip"
          ? await Gzip.compressString(data)
          : await Brotli.compressString(data);
      logger.debug(
        `Compressed (${compressWith}) ${data.length} bytes to ${
          compressed.length
        } bytes in ${new Date().getTime() - now.getTime()}ms`
      );
      await fs.promises.writeFile(file + ".enc", compressed);
      await fs.promises.writeFile(file + ".json", data);
    } else if (compress) {
      if (encounterDuration < ms("1m")) return;
      const now = new Date();
      const compressed =
        compressWith === "gzip"
          ? await Gzip.compressString(data)
          : await Brotli.compressString(data);
      logger.debug(
        `Compressed (${compressWith}) ${data.length} bytes to ${
          compressed.length
        } bytes in ${new Date().getTime() - now.getTime()}ms`
      );
      await fs.promises.writeFile(file + ".enc", compressed);
    } else {
      if (encounterDuration < ms("1m")) return;
      await fs.promises.writeFile(file + ".json", data);
    }
    logger.info(`Saved encounter to ${file}`);
    return true;
  } catch (err) {
    logger.error("Error saving encounter", err);
    return false;
  }
};

export const readEncounter = async (
  path: string,
  compression: "gzip" | "brotli" = "gzip"
): Promise<Session> => {
  try {
    await encounterDirExists(true);
    const data = await fs.promises.readFile(path);
    const uncompressed =
      compression === "gzip"
        ? await Gzip.decompress(data)
        : await Brotli.decompress(data);
    return new Session(JSON.parse(uncompressed));
  } catch (err) {
    logger.error("Error reading encounter", err);
    return Promise.reject(err);
  }
};

export const readEncounterSync = (
  path: string,
  compression: "gzip" | "brotli" = "gzip"
) => {
  try {
    const data = fs.readFileSync(path);
    const uncompressed =
      compression === "gzip"
        ? Gzip.decompressSync(data)
        : Brotli.decompressSync(data);
    return new Session(JSON.parse(uncompressed));
  } catch (err) {
    logger.error("Error reading encounter", err);
    return undefined;
  }
};

export const getNewEncounterName = (session: Session) => {
  const boss = session.getBoss();
  const dateString = formatDate(
    session.lastPacket > 0 ? session.lastPacket : undefined
  );

  if (boss) {
    return `${boss.name}_${dateString}`;
  } else {
    return `UNKNOWN_${dateString}`;
  }
};

export const formatDate = (number?: number) => {
  if (!number) number = +new Date();
  const date = new Date(number)
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .replace(/\./, "-")
    .replace(/Z/, "");

  return date;
};

export const getDateFromEncounterName = (encounterName: string) => {
  encounterName = encounterName.replace(".enc", "");
  const parts = encounterName.split("_");
  const date = parts[1];
  const time = parts[2].split("-");

  return new Date(`${date}T${time[0]}:${time[1]}:${time[2]}.${time[3]}Z`);
};

export const renameEncounter = async (oldPath: string, session: Session) => {
  try {
    const outPath = `${ENCOUNTER_DIR}\\${getNewEncounterName(session)}.enc`;
    await fs.promises.rename(oldPath, outPath);
    logger.debug(`Renamed encounter ${oldPath} to ${outPath}`);
    return true;
  } catch (err) {
    logger.error("Error renaming encounter", err);
    return Promise.reject(err);
  }
};

export const renameOldEncounters = async () => {
  try {
    const globDir = ENCOUNTER_DIR.replace(/\\/g, "/");
    const encounters = globSync(`${globDir}/*.enc`);
    for (const enc of encounters) {
      let session: Session;
      try {
        session = await readEncounter(enc);
      } catch {
        session = await readEncounter(enc, "brotli");
      }
      await renameEncounter(enc, session);
    }
    return encounters.length;
  } catch (err) {
    logger.error("Error renaming encounters", err);
    return Promise.reject(err);
  }
};

export const getTotalDps = (encounter: Session) => {
  const duration = (encounter.lastPacket - encounter.firstPacket) / 1000;
  let total = 0;
  for (const entity of encounter.entities) {
    if (entity.type !== EntityType.PLAYER) continue;
    total += entity.stats.damageDealt;
  }
  return duration > 0 && total > 0 ? total / duration : 0;
};

export const getEntityDps = (entity: Entity, begin: number, end: number) => {
  const duration = (end - begin) / 1000;
  return duration > 0 && entity.stats.damageDealt > 0
    ? entity.stats.damageDealt / duration
    : 0;
};

export const trySetClassFromSkills = (player: Entity) => {
  const skills = Object.values(player.skills);
  skills.every((skill) => {
    const classId = getClassIdFromSkillId(skill.id);
    if (classId !== 0) {
      player.classId = classId;
      player.class = getClassName(classId);
      player.type = EntityType.PLAYER;
      player.lastUpdate = +new Date();
      return false;
    }
    return true;
  });
};

let recentCache: string[] | undefined;
export const getRecentEncountersFromDisk = async (max = 10) => {
  try {
    await encounterDirExists(true);
    const allFiles = await glob(`/*.enc`, {
      root: ENCOUNTER_DIR,
      stat: true,
      withFileTypes: true,
    });
    if (allFiles.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    allFiles.sort((a, b) => b.birthtimeMs! - a.birthtimeMs!);
    const sorted = allFiles.splice(0, max);

    const currentFiles = sorted.map((f) => f.name);
    if (recentCache && _.isEqual(recentCache, currentFiles)) {
      // * logger.debug("No new recent encounters found");
      return undefined;
    }
    recentCache = [...currentFiles];

    const promises = [];
    for (const file of sorted) {
      promises.push(readEncounter(file.fullpath()));
    }

    const loadedEncounters = await Promise.all(promises);
    return loadedEncounters.map((enc) => enc.toSimpleObject());
  } catch (err) {
    logger.error("Error getting recent encounters", err);
    return Promise.reject(err);
  }
};
