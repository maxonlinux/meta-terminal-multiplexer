import { NextRequest, NextResponse } from "next/server";
import { api } from "@/shared/axios/api";
import { getEnv } from "../../../../../env.config";
import { AssetData } from "@/shared/types";

const env = await getEnv();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json([], { status: 200 });
  }

  const res = await api.get<AssetData[]>(`${env.CORE_URL}/assets/search`, {
    params: {
      query,
    },
  });

  return NextResponse.json(res.data);
}
