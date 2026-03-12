import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function QuizIndexPage() {
  const supabase = await createClient();
  const res = await supabase.from("quiz_themes").select("slug, ordre").order("ordre", { ascending: true }).limit(1);

  const first = (res.data ?? [])[0];
  if (first?.slug) {
    redirect(`/quiz/${encodeURIComponent(first.slug)}/intro`);
  }

  redirect("/quiz/termine");
}

