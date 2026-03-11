import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center py-10">
      <header className="w-full flex justify-center px-6">
        <Image src="/logo-mirokai.svg" alt="Logo Mirokaï" width={180} height={60} priority />
      </header>

      <main className="relative flex w-full flex-1 items-center justify-center">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <Link
            href="/intro"
            className="pointer-events-auto w-full max-w-xs px-4 py-3 text-center text-base font-medium text-zinc-900 shadow-sm"
            style={{
              borderRadius: 16,
              background: "var(--Neutral-25, #FDFDFD)",
            }}
            aria-label="Commencer l’exploration du plan"
          >
            Je commence
          </Link>
        </div>
      </main>
    </div>
  );
}
