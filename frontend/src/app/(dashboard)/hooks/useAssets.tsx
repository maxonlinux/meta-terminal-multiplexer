import useSWR from "swr";
import { AssetData } from "@/shared/types";
import { API_BASE, api } from "@/shared/axios/api";

const assetsPath = `${API_BASE}/api/assets`;

export const useAssets = () => {
  const { data, isLoading, error, mutate } = useSWR<AssetData[]>(
    assetsPath,
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
