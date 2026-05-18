import { describe, expect, it } from "vitest";
import { type AppConfig, configSchema } from "~/features/config/config.schema";

describe("configSchema", () => {
  it("validates a complete config", () => {
    const config: AppConfig = {
      username: "testuser",
      password: "testpass",
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("allows empty strings", () => {
    const config = { username: "", password: "" };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = configSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string fields", () => {
    const result = configSchema.safeParse({
      username: 123,
      password: "pass",
    });
    expect(result.success).toBe(false);
  });
});
