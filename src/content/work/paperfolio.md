---
title: Paperfolio
company: Paperfolio
kind: personal
role: Designer & Engineer
description: A paper-trading and research platform for screening Indian equities, testing strategies, and understanding portfolio performance.
dateRange: 'January 2026'
sortDate: 2026-01-06
location: Independent
order: 112
technologies: [Python, Django, Celery, Redis, PostgreSQL, Pydantic, httpx, Yahoo Finance]
achievements:
  - '**Market-wide research** — Collects fundamentals and price history for more than 1,200 Indian equities, with Tickertape as the primary source and Yahoo Finance as a fallback'
  - '**Paper portfolios** — Models holdings, buy and sell transactions, average cost, and portfolio value without putting real capital at risk'
  - '**Strategy testing** — Runs historical simulations and records trades and daily performance snapshots for later analysis'
  - '**Useful measurement** — Calculates CAGR, volatility, Sharpe ratio, and maximum drawdown alongside multi-timeframe technical and fundamental signals'
outcome: 'Paperfolio brings market data, screening, simulated execution, and performance analysis into one private research loop for exploring an investment thesis before risking real money.'
---

Investment ideas are easy to invent and surprisingly hard to examine honestly. A promising screen, a clean-looking chart, and one memorable winner can quickly become a strategy in your head. Paperfolio was built to put some distance between the idea and the conviction: collect the evidence, simulate the decisions, and measure what actually happened.

**The research surface starts with the market, not a watchlist.** Paperfolio collects fundamentals and historical prices for more than 1,200 Indian equities. Screeners expose valuation, profitability, leverage, dividends, and distance from 52-week ranges; stock pages combine those fundamentals with technical signals across multiple timeframes. Tickertape provides the richer primary dataset, while Yahoo Finance fills gaps and keeps price history available when the first source cannot.

**A paper portfolio makes every opinion accountable.** Buys and sells become transactions, transactions become holdings with an average cost, and holdings roll up into a portfolio whose value can be followed over time. The simulator uses the same underlying market data to replay a strategy historically, preserving individual trades and daily performance snapshots rather than returning only a flattering final percentage.

**Returns need context.** Paperfolio measures CAGR, volatility, Sharpe ratio, and maximum drawdown so two strategies with similar ending values do not look equivalent when one took a much rougher path. Post-trade analysis also checks what happened after an entry over several horizons, making it possible to inspect whether a signal was early, useful, or simply lucky.

**Data collection is treated as production work.** Slow external APIs and incomplete records run through Celery and Redis rather than blocking the interface. Responses are validated before persistence, synchronization can be resumed in batches, and the secondary provider acts as a deliberate fallback instead of an emergency patch. The result is less a stock-picking oracle than a personal laboratory: a place to turn intuition into a claim that can be tested.
