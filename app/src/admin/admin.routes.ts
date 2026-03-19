import { FastifyTypebox } from "@/types";

export default async function (api: FastifyTypebox) {
  api.register(import("./simulations/admin.simulations.routes"), {
    prefix: "/simulations",
  });
  api.register(import("./auth/admin.auth.routes"), {
    prefix: "/auth",
  });
}
