# SVJ Hook Generator — Project Context

## What this is
A free lead magnet web app for SVJ Media. Replaces the content 
checklist. Captures emails, delivers daily value, and funnels 
users into the SVJ ecosystem.

## Company
SVJ Media. Boston-based creator infrastructure company. 
Co-founders: Nico (business/funnels) and Ceaz (content/operations). 
We build monetization backends for streamers and content creators. 
We do not consult — we build. Revenue share model, zero upfront 
for partners.

## The funnel this app feeds
Free tool → SVJ Academy (free community) → $97 Blueprint 
(coming soon) → Community Build Partnership (rev share) → 
Full Backend Partnership (rev share)

## Target user
Two modes:
1. Content creators — 50K+ followers, posting consistently, 
   not monetizing their audience beyond brand deals
2. Streamers — 1,000+ concurrent viewers, Twitch/YouTube Live, 
   zero digital product infrastructure

## What the app does
Generates short-form video hooks and titles using the SVJ formula:
pattern-break opening → sharp thesis → proof or tension.
Also surfaces a digital product opportunity after every generation
to plant the backend-thinking seed.

## Tech stack
- Next.js 14 with App Router
- Tailwind CSS
- Supabase (database)
- Anthropic Claude API (claude-sonnet-4-20250514)
- ConvertKit (email capture)
- Vercel (hosting)

## Design system
- Background: #0A0A0A
- Cards: #111111 with 1px #222222 border
- Primary accent: #2563EB (electric blue)
- Text: #FFFFFF
- Secondary text: #9CA3AF
- CTA buttons: white fill, black text, 8px radius
- Font: Inter
- No gradients. No shadows. Clean and minimal.
- Mobile fully responsive

## Upsell logic (progressive, never aggressive)
- Generation 1: SVJ Academy banner appears (free community)
- Generation 3 lifetime: Blueprint + Partnership cards appear
- Partnership card qualifies the user — different copy for 
  creators vs streamers

## Brand voice
- Punchy. Short sentences. No hyphens. No corporate language.
- No motivational fluff. Peer-to-peer tone.
- "We build, we don't consult."
- Views don't equal money. Systems do.

## Key URLs (placeholder until live)
- SVJ Academy CTA: https://svjmedia.com
- Blueprint CTA: https://svjmedia.com
- Apply to partner CTA: https://svjmedia.com

## Environment variables needed
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CONVERTKIT_API_KEY=
CONVERTKIT_FORM_ID=

## What NOT to do
- No stock images anywhere
- No placeholder copy — every word should be written out
- Do not use the word "course" — use "program" or "blueprint"
- Do not use the word "consulting"
- Do not add features not listed here without asking first
- Never break the dark theme
