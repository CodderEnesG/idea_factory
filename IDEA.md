# Idea Factory — brief

> **Note:** This is the original brief, updated to its final framing. For the
> authoritative detail see: `PLAN.md` (MVP + architecture), `BUSINESS_MODEL.md`
> (business model v2), `AI_ANALYST.md` (analyst persona), `MARKET_KNOWLEDGE.md`
> (how the analyst knows the market), `THESIS_AND_LENS.md` (concrete first thesis
> + arbitrage lens).

## One-liner
A **thesis-driven venture & market intelligence** platform for an entrepreneur
network: continuously ingests startup/market signals, runs them through a
**specialized AI analyst** (a *decision function* bound to a configurable thesis)
across **multiple analytical lenses**, and outputs a **ranked opportunity queue**
plus a **growing, queryable ecosystem knowledge base**. Cross-market **arbitrage**
(e.g. adapt a US product to Turkey) is the **first and sharpest lens** — not the
whole product.

## Positioning
- **Global, thesis-agnostic platform.** Turkey/MENA arbitrage is the *first thesis*
  and proof point, not the brand. New theses/markets are added as config, not code.
- **Internal tool first**, then B2B (segment prioritized but not locked — see
  `BUSINESS_MODEL.md`).

## Who
- An existing network of entrepreneurs (founder + friends) who regularly brainstorm
  and build new ventures together.
- Later: non-competing B2B segments (angels/scouts, accelerators, corporate
  innovation) — resolves the "selling your alpha" tension.

## Core pain
- Impossible to stay on top of the full startup literature + new developments solo.
- New/growing startups and funding news scattered across many sources.
- Brainstorming is unstructured; no systematic pipeline from "signal" → "analyzed,
  ranked, validated opportunity".

## What it does
1. **Ingest** from reachable sources first (YC, ProductHunt, newsletters/RSS, free
   funding feeds). LinkedIn/Twitter deferred to phase 2 (anti-scrape + ToS).
2. **Track**: new startups, growing startups, funding rounds, investment news.
3. **Analyze** with a specialized AI analyst — a *decision function*, not flavor
   text. Three layers: a stable skeptical operator-investor **character** + a
   configurable **thesis** (mandate) + composable **lenses** (arbitrage first).
   The analyst is **grounded, not fine-tuned**: market knowledge comes from thesis
   config + a curated knowledge base (RAG) + live web search + gold-standard
   exemplars + memory. (See `AI_ANALYST.md`, `MARKET_KNOWLEDGE.md`.)
4. **Rank**: ordered opportunity queue with rationale, adaptation notes, risks,
   confidence, a mandatory validation block (what's missing, why, how to verify),
   and a recommended action (pursue/watch/kill). v1 ranker = thesis-fit score
   (0-100, strict bands) + freshness as within-band tiebreaker; composite
   multi-lens scoring is phase 2.
5. **Accumulate**: every signal + analysis + human decision is written to a
   persistent, queryable knowledge layer that compounds over time.

## Vision
A true "idea factory": signal in → multi-lens analysis + ranked venture ideas +
compounding ecosystem memory out, continuously. The lens and output layers are
decoupled, so the system can evolve into adjacent products (trend reports, sector
maps, a research layer) without re-architecture.

## Resolved decisions (were open questions)
- **Narrowest wedge first?** → Arbitrage lens + startup/funding tracking + knowledge
  base, combined, for the internal network. (`PLAN.md`)
- **Who consumes output, in what format?** → Ranked queue + periodic digest +
  queryable knowledge base; live dashboard is phase 2. (`PLAN.md`)
- **Build vs. buy ingestion?** → Reachable-first (RSS/API), `skillify`'d scrapers
  for the rest; hostile sources (LinkedIn/X) deferred. (`PLAN.md`)
- **What makes the analysis trustworthy vs. noise?** → Grounding (not fine-tune) +
  fact/inference separation + calibrated confidence + anti-patterns + exemplars +
  human feedback. (`MARKET_KNOWLEDGE.md`, `AI_ANALYST.md`)
- **Internal tool vs. product?** → Internal first; global thesis-agnostic B2B later,
  beachhead segment prioritized but not locked. (`BUSINESS_MODEL.md`)
