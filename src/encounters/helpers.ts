import os from "os";
import fs from "fs";
import log from "electron-log";
import { Entity, ENTITY_TYPE, Session } from "./objects";
import { Brotli, Gzip } from "@/util/compression";
import glob from "glob";

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

    if (debug) {
      const now = new Date();
      const compressed =
        compressWith === "gzip"
          ? await Gzip.compressString(data)
          : await Brotli.compressString(data);
      log.debug(
        `Compressed (${compressWith}) ${data.length} bytes to ${
          compressed.length
        } bytes in ${new Date().getTime() - now.getTime()}ms`
      );
      await fs.promises.writeFile(file + ".enc", compressed);
      await fs.promises.writeFile(file + ".json", data);
    } else if (compress) {
      const now = new Date();
      const compressed =
        compressWith === "gzip"
          ? await Gzip.compressString(data)
          : await Brotli.compressString(data);
      log.debug(
        `Compressed (${compressWith}) ${data.length} bytes to ${
          compressed.length
        } bytes in ${new Date().getTime() - now.getTime()}ms`
      );
      await fs.promises.writeFile(file + ".enc", compressed);
    } else {
      await fs.promises.writeFile(file + ".json", data);
    }
    log.info(`Saved encounter to ${file}`);
    return true;
  } catch (err) {
    log.error("Error saving encounter: " + (err as Error).message);
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
    log.error("Error reading encounter:", err);
    return Promise.reject(err);
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

export const renameEncounter = async (oldPath: string, session: Session) => {
  try {
    const outPath = `${ENCOUNTER_DIR}\\${getNewEncounterName(session)}.enc`;
    await fs.promises.rename(oldPath, outPath);
    log.debug(`Renamed encounter ${oldPath} to ${outPath}`);
    return true;
  } catch (err) {
    log.error("Error renaming encounter:", err);
    return Promise.reject(err);
  }
};

export const renameOldEncounters = async () => {
  try {
    const globDir = ENCOUNTER_DIR.replace(/\\/g, "/");
    const encounters = glob.sync(`${globDir}/*.enc`);
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
    log.error("Error renaming encounters:", err);
    return Promise.reject(err);
  }
};

export const getTotalDps = (encounter: Session) => {
  const duration = (encounter.lastPacket - encounter.firstPacket) / 1000;
  let total = 0;
  for (const entity of encounter.entities) {
    if (entity.type !== ENTITY_TYPE.PLAYER) continue;
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
