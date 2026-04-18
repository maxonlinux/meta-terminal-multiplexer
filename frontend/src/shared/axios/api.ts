import axios from "axios";

export const API_BASE = "/api";

export const api = axios.create({
  withCredentials: true,
});
