import useSWR from "swr";
import { AssetData } from "@/shared/types";
import { api } from "@/shared/axios/api";
import { withBasePath } from "@/shared/base-path";

const assetsPath = withBasePath("/api/assets");

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
