"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { API_BASE, api } from "@/shared/axios/api";

export default function SetupPage() {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password !== repeatPassword) {
        throw new Error("Passwords do not match");
      }

      // POST запрос к бекенду, который сохранит пароль (например /api/admin/setup)
      await api.post(`${API_BASE}/api/proxy/multiplexer/admin/auth/setup`, {
        password,
      });

      // После успешного сохранения — редиректим на логин
      router.push("/login");
    } catch (err) {
      const FALLBACK_ERROR = "Error ocurred";

      if (isAxiosError(err)) {
        setError(err.response?.data?.error || FALLBACK_ERROR);
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      setError(FALLBACK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-between h-dvh max-w-md mx-auto p-4">
      <form onSubmit={handleSetup} className="w-full p-4">
        <label className="block mb-2 font-medium" htmlFor="password">
          Setup password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-white/10 rounded-sm mb-4 focus:ring focus:ring-white focus:outline-0"
          placeholder=""
          disabled={loading}
        />
        <label className="block mb-2 font-medium" htmlFor="repeat-password">
          Repeat password
        </label>
        <input
          id="repeat-password"
          type="password"
          required
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          className="w-full p-2 border border-white/10 rounded-sm mb-4 focus:ring focus:ring-white focus:outline-0"
          placeholder=""
          disabled={loading}
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-between px-4 w-full bg-white text-black font-semibold py-2 rounded-sm hover:bg-white/90 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Loading..." : "Submit"}
          <ArrowRight size={16} />
        </button>
      </form>
    </main>
  );
}
