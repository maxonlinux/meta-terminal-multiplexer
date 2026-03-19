import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "../../../../env.config";
import { withErrorHandler, withCookies } from "../utils";

const env = await getEnv();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  const api = withCookies(req);

  const handler = async () => {
    const { data } = await api.get(`${env.CORE_URL}/assets`, {
      params: symbol ? { symbol } : {},
    });
    return NextResponse.json(data);
  };

  return withErrorHandler(handler);
}
