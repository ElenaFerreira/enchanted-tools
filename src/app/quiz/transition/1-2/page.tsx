"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function QuizTransitionOneTwoPage() {
  const router = useRouter();
  const [nextHref, setNextHref] = useState("/quiz");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const nextThemeSlug = url.searchParams.get("nextTheme");
      setNextHref(nextThemeSlug ? `/quiz/${encodeURIComponent(nextThemeSlug)}/intro` : "/quiz");
    } catch {
      setNextHref("/quiz");
    }
  }, []);

  return (
    <div className="flex min-h-dvh w-full bg-black">
      <video
        className="h-dvh w-full object-cover"
        autoPlay
        playsInline
        controls={false}
        onEnded={() => router.replace(nextHref)}
      >
        <source src="/quiz/transition_1_2.mp4" type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de cette vidéo.
      </video>
    </div>
  );
}

