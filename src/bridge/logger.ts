import { Decompressor } from "meter-core/dist/decompressor";
import { PktCapture, findDevice } from "meter-core/dist/pkt-capture";
import { PKTStream } from "meter-core/dist/pkt-stream";
import { LegacyLogger } from "meter-core/dist/legacy-logger";
import { MeterData } from "meter-core/dist/data";
import { EventEmitter } from "events";
import { readFileSync } from "fs";
import path from "path";
import os from "os";
import dns from "dns";

const isDevelopment = process.env.NODE_ENV !== "production";

export default class LostArkLogger extends EventEmitter {
  private _decompressor: Decompressor | undefined;
  private _pktCapture: PktCapture | undefined;
  private _pktStream: PKTStream | undefined;
  private _xor: Buffer | undefined;
  private _oodle: Buffer | undefined;
  private _meterData: MeterData | undefined;
  private _legacyLogger: LegacyLogger | undefined;
  public device = "";

  static METER_DATA = isDevelopment
    ? path.resolve(__dirname, "../meter-data")
    : "./meter-data";

  constructor() {
    super();
  }

  public async start() {
    this._xor = readFileSync(`${LostArkLogger.METER_DATA}/xor.bin`);
    this._oodle = readFileSync(`${LostArkLogger.METER_DATA}/oodle_state.bin`);
    this._decompressor = new Decompressor(this._oodle, this._xor);
    this._pktStream = new PKTStream(this._decompressor);

    const device = await getDevice();
    this.device = device;

    this._pktCapture = new PktCapture(device);
    this._pktCapture.on("packet", this._pktStream.read);

    this._meterData = new MeterData();
    this.parseMeterData();

    this._legacyLogger = new LegacyLogger(this._pktStream, this._meterData);
    this._legacyLogger.on("line", (line) => this.emit("packet", line));
  }

  public stop() {
    if (this._legacyLogger) {
      this._legacyLogger.removeAllListeners();
    } else {
      throw new Error("Legacy Logger is not initialized");
    }
  }

  private parseMeterData() {
    if (!this._meterData) {
      throw new Error("Meter Data is not initialized");
    }

    this._meterData.processEnumData(
      JSON.parse(
        readFileSync(
          `${LostArkLogger.METER_DATA}/databases/Enums.json`,
          "utf-8"
        )
      )
    );
    this._meterData.processNpcData(
      JSON.parse(
        readFileSync(`${LostArkLogger.METER_DATA}/databases/Npc.json`, "utf-8")
      )
    );
    this._meterData.processPCData(
      JSON.parse(
        readFileSync(
          `${LostArkLogger.METER_DATA}/databases/PCData.json`,
          "utf-8"
        )
      )
    );
    this._meterData.processSkillData(
      JSON.parse(
        readFileSync(
          `${LostArkLogger.METER_DATA}/databases/Skill.json`,
          "utf-8"
        )
      )
    );
    this._meterData.processSkillBuffData(
      JSON.parse(
        readFileSync(
          `${LostArkLogger.METER_DATA}/databases/SkillBuff.json`,
          "utf-8"
        )
      )
    );
    this._meterData.processSkillBuffEffectData(
      JSON.parse(
        readFileSync(
          `${LostArkLogger.METER_DATA}/databases/SkillEffect.json`,
          "utf-8"
        )
      )
    );
  }
}

const getDevice = async (): Promise<string> => {
  return new Promise((r, j) => {
    const host = os.hostname();
    dns.lookup(host, (err, address) => {
      if (err) j(err);

      const device: string = findDevice(address);
      r(device);
    });
  });
};