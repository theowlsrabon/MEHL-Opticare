import app from "../server";
import { initializeDatabase } from "../serverDb";

let isDbInit = false;

export default async function handler(req: any, res: any) {
  if (!isDbInit) {
    try {
      await initializeDatabase();
      isDbInit = true;
    } catch (e) {
      console.warn("DB init warning:", e);
    }
  }
  return (app as any)(req, res);
}

