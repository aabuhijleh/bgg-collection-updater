import z from "zod";

export const configSchema = z.object({
  username: z.string(),
  password: z.string(),
  apiToken: z.string(),
});

export type AppConfig = z.infer<typeof configSchema>;

export const emptyConfig: AppConfig = {
  username: "",
  password: "",
  apiToken: "",
};
