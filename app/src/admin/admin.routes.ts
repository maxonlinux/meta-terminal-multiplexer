import { FastifyTypebox } from "@/types";
import { adminAuthHook } from "./auth/admin.auth.hook";

export default async function (api: FastifyTypebox) {
  api.register(import("./auth/admin.auth.routes"), {
    prefix: "/auth",
  });

  api.register(
    async (protectedAdmin) => {
      protectedAdmin.register(import("./simulations/admin.simulations.routes"), {
        prefix: "/simulations",
      });
    },
    {
      onRequest: [adminAuthHook],
    }
  );
}
