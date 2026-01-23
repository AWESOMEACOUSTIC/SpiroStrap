import { db } from "./db.js";

export const storage = {
  getDbInfo() {
    return db;
  },
};
