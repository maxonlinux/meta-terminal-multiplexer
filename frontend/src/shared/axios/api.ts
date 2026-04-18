import axios from "axios";

export const API_BASE = "";

export const api = axios.create({
  withCredentials: true,
});
