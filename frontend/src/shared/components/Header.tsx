"use client";

import { api } from "@/shared/axios/api";
import { ArrowRight } from "lucide-react";
import { Button } from "react-aria-components";

const logout = async () => {
  await api.post(`/api/proxy/multiplexer/admin/auth/logout`);
  location.reload();
};

export const Header = () => (
  <header className="flex items-center justify-between p-2">
    <p className="font-black text-sm">MULTIPLEXER ADMIN</p>
    <Button
      onClick={logout}
      className="flex items-center gap-1 border border-red-400/10 p-1 px-2 rounded-sm cursor-pointer hover:bg-red-400/5 text-red-400"
    >
      <span className="text-sm font-medium">Exit</span>
      <ArrowRight size={16} />
    </Button>
  </header>
);
