"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function QuizTransitionOneTwoPage() {
  const search = useSearchParams();
  const router = useRouter();
  const nextThemeSlug = search.get("nextTheme");
  const nextHref = nextThemeSlug ? `/quiz/${encodeURIComponent(nextThemeSlug)}/intro` : "/quiz";

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

