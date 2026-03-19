import { Header } from "../../shared/components/Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col h-dvh">
      <Header />
      {children}
      <footer className="text-current/50 text-xs text-center p-2">
        Use with care!
      </footer>
    </main>
  );
}
