import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { type AppConfig, configSchema, emptyConfig } from "./config.schema";

const CONFIG_PATH = path.join(os.homedir(), ".bgg-collection-updater.json");

export const loadConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<AppConfig> => {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      const parsed = configSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      return emptyConfig;
    } catch {
      return emptyConfig;
    }
  },
);

export const saveConfig = createServerFn({ method: "POST" })
  .inputValidator(configSchema)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8");
    return { success: true };
  });
