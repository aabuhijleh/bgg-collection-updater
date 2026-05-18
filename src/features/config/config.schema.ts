import z from "zod";

export const configSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type AppConfig = z.infer<typeof configSchema>;

export const emptyConfig: AppConfig = {
  username: "",
  password: "",
};
