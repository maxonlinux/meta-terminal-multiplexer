"use client";

import { useState } from "react";
import axios, { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Отправляем пароль на бекенд для аутентификации
      // Бекенд должен в ответе установить httpOnly cookie с JWT
      await axios.post("/api/proxy/multiplexer/admin/auth/login", { password });

      // При успешном входе редиректим на /
      router.push("/");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Wrong password");
      } else {
        setError("Wrong password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-between h-dvh max-w-md mx-auto p-4">
      <form onSubmit={handleLogin} className="w-full p-4">
        <label className="block mb-2 font-medium" htmlFor="password">
          Enter password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
