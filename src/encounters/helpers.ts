import os from "os";
import fs from "fs";
import log from "electron-log";
import { Entity, ENTITY_TYPE, Session } from "./objects";
import { Brotli, Gzip } from "@/util/compression";

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
    const file = `${ENCOUNTER_DIR}\\${+new Date()}_${encounter.id}`;
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
  id: string
): Promise<Session | undefined> => {
  try {
    await encounterDirExists(true);
    const file = `${ENCOUNTER_DIR}\\${id}.enc`;
    const data = await fs.promises.readFile(file);
    const uncompressed = await Gzip.decompress(data);
    return new Session(JSON.parse(uncompressed));
  } catch (err) {
    log.error("Error reading encounter: " + (err as Error).message);
    return undefined;
  }
};

export const getTotalDps = (log: Session) => {
  const duration = (log.lastPacket - log.firstPacket) / 1000;
  let total = 0;
  for (const entity of log.entities) {
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
