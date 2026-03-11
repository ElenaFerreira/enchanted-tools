import Image from "next/image";
import { PrimaryCTA } from "./components/PrimaryCTA";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center py-10">
      <header className="w-full flex justify-center px-6">
        <Image src="/logo-mirokai.svg" alt="Logo Mirokaï" width={180} height={60} priority />
      </header>

      <main className="relative flex w-full flex-1 items-center justify-center">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <PrimaryCTA href="/intro" label="Je commence" ariaLabel="Commencer l’exploration du plan" />
        </div>
      </main>
    </div>
  );
}
