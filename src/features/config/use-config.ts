import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { loadConfig, saveConfig } from "./config.api";
import type { AppConfig } from "./config.schema";

export const configQueryOptions = queryOptions({
  queryKey: ["config"],
  queryFn: () => loadConfig(),
  staleTime: Number.POSITIVE_INFINITY,
});

export function useConfig() {
  return useQuery(configQueryOptions);
}

export function useSaveConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AppConfig) => saveConfig({ data: config }),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(configQueryOptions.queryKey, variables);
    },
  });
}
