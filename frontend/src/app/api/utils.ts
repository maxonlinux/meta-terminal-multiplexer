import axios, { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "../../../env.config";

const env = await getEnv();

export const withCookies = (req: NextRequest) => {
  const cookie = req.headers.get("cookie");

  return axios.create({
    baseURL: env.CORE_URL,
    headers: {
      Cookie: cookie,
    },
    withCredentials: true,
  });
};

const handleError = (err: unknown) => {
  if (isAxiosError(err)) {
    return NextResponse.json(
      { error: err.response?.data.error ?? "Internal Server Error" },
      { status: err.response?.status ?? 500 }
    );
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
};

export const withErrorHandler = async (cb: CallableFunction) => {
  try {
    return await cb();
  } catch (error) {
    return handleError(error);
  }
};
