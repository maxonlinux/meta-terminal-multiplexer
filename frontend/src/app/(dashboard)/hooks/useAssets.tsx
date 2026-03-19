import useSWR from "swr";
import { AssetData } from "@/shared/types";
import { api } from "@/shared/axios/api";

export const useAssets = () => {
  const { data, isLoading, error, mutate } = useSWR<AssetData[]>(
    "/api/assets",
    async (url: string) => {
      const res = await api.get(url);
      return res.data;
    }
  );

  return {
    revalidate: mutate,
    assets: data,
    isLoading,
    error,
  };
};
