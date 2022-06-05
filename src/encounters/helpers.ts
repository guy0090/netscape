import os from "os";
import fs from "fs";
import { Session } from "./objects";
import { Brotli, Gzip } from "@/util/compression";

export const USER_HOME_DIR = os.homedir();
export const ENCOUNTER_DIR = `${USER_HOME_DIR}\\Documents\\Netscape\\Encounters`;

export const encounterDirExists = async (create = false) => {
  try {
    const dir = await fs.promises.stat(ENCOUNTER_DIR);
    return dir.isDirectory();
  } catch (err: any) {
    if (err.code === "ENOENT") {
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
  compressWith = "gzip"
) => {
  try {
    await encounterDirExists(true);
    const file = `${ENCOUNTER_DIR}\\${+new Date()}_${encounter.id}.enc`;
    const data = JSON.stringify(encounter);

    if (compress) {
      const now = new Date();
      const compressed =
        compressWith === "gzip"
          ? await Gzip.compressString(data)
          : await Brotli.compressString(data);
      console.log(
        `Compressed (${compressWith}) ${data.length} bytes to ${
          compressed.length
        } bytes in ${new Date().getTime() - now.getTime()}ms`
      );
      await fs.promises.writeFile(file, compressed);
    } else {
      await fs.promises.writeFile(file, data);
    }
    console.log(`Saved encounter to ${file}`);
    return true;
  } catch (err: any) {
    console.error("Error saving encounter: " + err.message);
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
  } catch (err: any) {
    console.error("Error reading encounter: " + err.message);
    return undefined;
  }
};
