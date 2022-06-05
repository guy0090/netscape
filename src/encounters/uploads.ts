import axios, { AxiosRequestConfig } from "axios";
import { Session } from "@/encounters/objects";
import AppStore from "@/persistance/store";

const isDevelopment = process.env.NODE_ENV !== "production";

export const UPLOAD_URL = isDevelopment
  ? "http://localhost"
  : "https://api.dps.arsha.io";
export const UPLOAD_ENDPOINT = "/logs/upload";
export const RECENT_ENDPOINT = "logs/recents";

export const uploadSession = async (session: Session) => {
  try {
    const uploadKey = await AppStore.getPassword();
    const upload = JSON.stringify({ key: uploadKey, session: session });

    const uploadConfig = {
      method: "PUT",
      url: `${UPLOAD_URL}${UPLOAD_ENDPOINT}`,
      responseType: "json",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": upload.length,
      },
      data: upload,
    } as AxiosRequestConfig;

    const response = await axios(uploadConfig);
    return response.data;
  } catch (err: any) {
    console.error(err.message);
    return undefined;
  }
};

export const getRecentLogs = async () => {
  try {
    const uploadKey = await AppStore.getPassword();
    const request = {
      method: "POST",
      url: `${UPLOAD_URL}${RECENT_ENDPOINT}`,
      data: {
        key: uploadKey,
        range: { begin: +new Date() - 604799000 },
      },
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await axios(request);
    if (response.data) {
      const sessions = response.data as Session[];
      return sessions.map((s: any) => new Session(s));
    } else {
      return [];
    }
  } catch (err: any) {
    console.error(err.message);
    return undefined;
  }
};
