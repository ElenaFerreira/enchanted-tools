## Enchanted Tools – Mirokaï Experience Companion

Application web (PWA) conçue dans le cadre de la compétition Digital Campus 2026 pour **Enchanted Tools Paris**.  
Elle accompagne la **Mirokaï Experience** en proposant un parcours ludique et narratif autour des robots Mirokaï et du Mirium, tout en offrant des outils d’administration pour l’équipe en charge de l’espace démo.

---

### 0. Rappel du projet

- **Contexte**  
  Enchanted Tools ouvre les portes de son espace au 18 rue de la Fontaine au Roi (Paris 11ᵉ) pour faire découvrir les robots Mirokaï au grand public (familles, enfants, étudiants, curieux, touristes…).  
  L’objectif est de **démocratiser la robotique** et de montrer que les Mirokaï sont des compagnons sociaux utiles, chaleureux et accessibles.

- **Problématique**

  > Comment faciliter l’expérience et la relation humaine avec les robots au sein de l’espace démo et la promouvoir ?

- **Mission de cette PWA**
  - Transformer les contenus (quiz, audioguides, narration) en une **expérience immersive et guidée** dans l’espace Mirokaï Experience.
  - Aider les visiteurs à **comprendre l’univers des Mirokaï** (origines, Mirium, cas d’usage) via un parcours de quiz scénarisé.
  - Fournir à l’équipe Enchanted Tools un **socle technique administrable** (via Supabase) pour faire évoluer facilement les thèmes, chapitres et questions sans repasser par le code.
  - S’inscrire dans une **stratégie globale de communication** (événements, Mirokaï Experience, Robot Drinks, etc.) en proposant un support numérique cohérent avec l’identité de marque.

---

### 1. Documentation technique

- **Stack principale**
  - **Frontend** : Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4
  - **Backend** : Next.js (Server Components / API) + Supabase (PostgreSQL, Auth, Storage)
  - **PWA** : `public/manifest.json`, `public/sw.js`
  - **Hébergement** : Vercel (build & déploiement continus)
- **Organisation du code**
  - `src/app` : routes applicatives (App Router)
    - `intro/` : vidéo d’intro et CTA vers l’onboarding (mise en contexte de l’univers Mirokaï).
    - `onboarding/` : préparation de la session (contexte de visite, joueurs, rôles…).
    - `plan/` : hub / plan de l’espace (point de retour après reset ou fin de parcours).
    - `quiz/` : parcours de quiz scénarisé utilisé comme **fil narratif** de l’expérience
      - `/quiz/[themeSlug]/chapitre/[chapitreSlug]/play` : logique de jeu (timer, rhunes, bonnes réponses…)
      - `/quiz/[themeSlug]/suite` : écrans de transition entre thèmes / mondes
      - `/quiz/transition/1-2`, `/2-3`, `/3-4` : vidéos de transition immersives entre mondes
      - `/quiz/termine` : écran de résultats / gagnant et retour vers Miroki
      - `/quiz/reset` : remise à zéro de la session (localStorage + redirection vers `/plan`)
    - `admin/` : panneau d’administration (si activé, réservé aux rôles admin) pour piloter le contenu.
    - `login/` : écran de connexion (accès équipe / admin).
  - `src/components` : composants UI réutilisables (`PrimaryCTA`, `BurgerMenu`, etc.)
  - `src/lib` : logique métier (par ex. `quiz/state.ts` pour la gestion d’état du quiz, des scores et des rhunes)
  - `src/lib/supabase` : clients Supabase (`client.ts`, `server.ts`, `middleware.ts`)
  - `src/middleware.ts` : middleware d’authentification et de gestion de session
  - `public/` : assets statiques, service worker, manifest, icônes
- **Conventions clés**
  - Imports avec alias `@/*` pointant sur `./src/*`
  - Langue de l’UI : **français** uniquement
  - Server Components par défaut, `"use client"` seulement pour les écrans interactifs

---

### 2. Schéma d’architecture

```text
                 ┌──────────────────────┐
                 │      Utilisateur     │
                 │  (smartphone / web)  │
                 └─────────┬────────────┘
                           │
                           │ Navigateur / PWA
                           │ (manifest.json + sw.js)
                 ┌─────────▼────────────┐
                 │  Next.js (App Router)│
                 │   React + Tailwind   │
                 └─────────┬────────────┘
           ┌───────────────┼─────────────────┐
           │               │                 │
           │               │                 │
 ┌─────────▼──────┐  ┌─────▼────────┐  ┌─────▼───────┐
 │  Module Quiz   │  │ Interface    │  │ Middleware  │
 │ (pages /quiz)  │  │  Admin       │  │    Auth     │
 └────────┬───────┘  └─────┬────────┘  └─────┬───────┘
          │                │                 │
          │                │                 │
          │                │          ┌──────▼─────────┐
          │                └──────────►  Supabase Auth │
          │                           └────────────────┘
          │
          │ lecture / écriture
          │ (thèmes, chapitres, questions, réponses)
  ┌───────▼────────────────────────────────────────────┐
  │              Supabase PostgreSQL (DB)              │
  └────────────────────────────────────────────────────┘

                 ┌──────────────────────┐
                 │  Service Worker (SW) │
                 │   (offline, cache)   │
                 └─────────┬────────────┘
                           │
                           ▼
                 ┌──────────────────────┐
                 │   Cache offline      │
                 │  (assets, pages…)    │
                 └──────────────────────┘
```

---

### 3. Guide d’installation

- **Prérequis**
  - Node.js 20+
  - npm ou pnpm ou bun
  - Un projet Supabase configuré (URL + clé anon + éventuellement clé service pour les scripts)

1. **Cloner le dépôt**

```bash
git clone <URL_DU_REPO>
cd enchanted-tools
```

2. **Installer les dépendances**

```bash
npm install
# ou
pnpm install
```

3. **Configurer l’environnement**

Créer un fichier `.env.local` à la racine avec au minimum :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # optionnel si nécessaire côté serveur
```

4. **Lancer le serveur de développement**

```bash
npm run dev
```

Puis ouvrir `http://localhost:3000` dans le navigateur.

---

### 4. Guide d’utilisation admin

- **Accès admin**
  - Les comptes admin sont identifiés via `user.app_metadata.role = "admin"` dans Supabase.
  - Après connexion, l’admin accède à la section `admin` (URL du type `/admin` ou `/admin/quiz` selon la configuration exacte).

- **Fonctionnalités typiques (à adapter à votre instance)**
  - Gestion des **thèmes de quiz** (création, modification, activation/désactivation).
  - Gestion des **chapitres** d’un thème (ordre, titre, description, contenu pédagogique).
  - Gestion des **questions / réponses** pour chaque chapitre.
  - Consultation des **résultats agrégés** (scores, temps, progression).

- **Bonnes pratiques**
  - Ne pas supprimer des données critiques : privilégier un champ `archived` / `active` quand disponible.
  - Vérifier les libellés en français et l’accessibilité (labels, contrastes) lors de la création de contenu.

---

### 5. Exemples de données

Le projet utilise Supabase avec les tables suivantes (noms effectifs côté code) :

- **Table `quiz_themes`**
  - `id` (uuid)
  - `slug` (text) – utilisé dans l’URL `/quiz/[themeSlug]`
  - `ordre` (integer) – ordre d’affichage / de progression
  - `titre` (text) – nom du thème (ex. "Histoire et mythologie")

- **Table `quiz_chapitres`**
  - `id` (uuid)
  - `theme_id` (uuid, FK vers `quiz_themes.id`)
  - `slug` (text) – utilisé dans `/quiz/[themeSlug]/chapitre/[chapitreSlug]`
  - `ordre` (integer) – ordre dans le thème
  - `titre` (text)

- **Table `quiz_questions`**
  - `id` (uuid)
  - `chapitre_id` (uuid, FK vers `quiz_chapitres.id`)
  - `ordre` (integer)
  - `texte` (text) – énoncé de la question
  - `aide_texte` (text) – texte d’aide affiché après une mauvaise réponse
  - `audience` (text) – `"adultes"` ou `"enfants"`

- **Table `quiz_reponses`**
  - `id` (uuid)
  - `question_id` (uuid, FK vers `quiz_questions.id`)
  - `ordre` (integer)
  - `texte` (text) – texte de la réponse
  - `is_correct` (boolean) – indique la bonne réponse

Le code côté front attend pour chaque question :

- exactement **3 réponses** dans `quiz_reponses`,
- exactement **1 seule réponse correcte** (`is_correct = true`).

Un jeu minimal de données peut être inséré via l’interface Supabase ou des scripts SQL pour avoir :

- 1 thème de test (par ex. slug `histoire-mythologie`)
- 2 à 3 chapitres liés
- au moins 1 question par chapitre, avec 3 réponses dont 1 correcte.

---

### 6. Instructions de déploiement

- **Build de production**

```bash
npm run build
npm run start
```

- **Variables d’environnement en production**
  - Reprendre les variables de `.env.local` dans le système d’env de la plateforme (Vercel, Docker, etc.).
  - Vérifier que les URLs Supabase pointent vers l’instance de prod.

- **Déploiement type Vercel**
  - Connecter le dépôt Git à Vercel.
  - Configurer les variables d’environnement dans le dashboard.
  - Lancer un déploiement ; Vercel utilise automatiquement `npm run build`.

- **PWA**
  - S’assurer que `manifest.json` et `sw.js` sont bien servis en prod.
  - Tester l’installation de l’application (Chrome DevTools → Application → Manifest + Service Workers).

---

### 7. Qualité du code et éco-conception

- Pas de `console.log` en production (uniquement `console.error` pour les erreurs critiques).
- Sélection des colonnes nécessaires dans les requêtes Supabase (éviter `select("*")`).
- Composants React courts, réutilisables et typés strictement (pas de `any` non justifié).
- UI accessible : labels explicites, navigation clavier possible, contrastes suffisants, texte en français partout.
