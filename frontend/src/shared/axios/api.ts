import axios from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || "";

export const api = axios.create({
  withCredentials: true,
});
