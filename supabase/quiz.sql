-- Schéma pour le quizz (4 thèmes -> chapitres/audio -> questions adultes/enfants -> 3 réponses).
-- À exécuter dans l’éditeur SQL Supabase.

create table if not exists public.quiz_themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  ordre integer not null,
  titre text not null,
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists quiz_themes_ordre_unique on public.quiz_themes (ordre);

create table if not exists public.quiz_chapitres (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.quiz_themes (id) on delete cascade,
  slug text not null unique,
  ordre integer not null,
  titre text not null,
  resume text not null,
  audio_url text,
  created_at timestamptz not null default now(),
  constraint quiz_chapitres_theme_ordre_unique unique (theme_id, ordre)
);

create index if not exists quiz_chapitres_theme_id_idx on public.quiz_chapitres (theme_id);

do $$ begin
  if not exists (select 1 from pg_type where typname = 'quiz_audience') then
    create type public.quiz_audience as enum ('adultes', 'enfants');
  end if;
end $$;

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  chapitre_id uuid not null references public.quiz_chapitres (id) on delete cascade,
  ordre integer not null,
  audience public.quiz_audience not null,
  texte text not null,
  aide_texte text not null,
  created_at timestamptz not null default now(),
  constraint quiz_questions_chapitre_ordre_audience_unique unique (chapitre_id, ordre, audience)
);

create index if not exists quiz_questions_chapitre_id_idx on public.quiz_questions (chapitre_id);

create table if not exists public.quiz_reponses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  ordre integer not null,
  texte text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  constraint quiz_answers_question_ordre_unique unique (question_id, ordre)
);

create index if not exists quiz_reponses_question_id_idx on public.quiz_reponses (question_id);

-- Lecture publique (anon key) en lecture seule.
alter table public.quiz_themes enable row level security;
alter table public.quiz_chapitres enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_reponses enable row level security;

drop policy if exists "quiz_themes_public_select" on public.quiz_themes;
create policy "quiz_themes_public_select" on public.quiz_themes
for select
to anon, authenticated
using (true);

drop policy if exists "quiz_chapitres_public_select" on public.quiz_chapitres;
create policy "quiz_chapitres_public_select" on public.quiz_chapitres
for select
to anon, authenticated
using (true);

drop policy if exists "quiz_questions_public_select" on public.quiz_questions;
create policy "quiz_questions_public_select" on public.quiz_questions
for select
to anon, authenticated
using (true);

drop policy if exists "quiz_reponses_public_select" on public.quiz_reponses;
create policy "quiz_reponses_public_select" on public.quiz_reponses
for select
to anon, authenticated
using (true);

