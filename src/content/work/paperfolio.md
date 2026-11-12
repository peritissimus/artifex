---
title: Paperfolio
company: Paperfolio
kind: personal
role: Designer & Engineer
description: 'A paper-trading and research platform for screening Indian equities and examining historical strategies.'
seoTitle: 'Paperfolio – Paper Trading and Screening for Indian Equities'
dateRange: 'January 2026'
sortDate: 2026-01-06
location: Independent
order: 112
technologies: [Python, Django, Celery, Redis, PostgreSQL, Pydantic, httpx, Yahoo Finance]
achievements:
  - '**Research** — Fundamentals and prices for more than 1,200 Indian equities'
  - '**Simulation** — Paper transactions, historical trades, and daily portfolio snapshots'
  - '**Data pipeline** — Django and PostgreSQL, with Celery/Redis ingestion and provider fallback'
updated: 2026-11-12
---

I built Paperfolio to examine investing ideas before putting money behind them. Moving between data sites, spreadsheets, and separate backtests made it easy to remember the evidence I liked and lose track of the rest. I wanted market data, simulated trades, and performance history in one place.

## Starting with a screen

Paperfolio collects fundamentals and historical prices for more than 1,200 Indian equities. I can filter by valuation, profitability, debt, dividends, and price ranges, then look at a stock's fundamentals and technical signals across several timeframes. Tickertape is the primary data source, with Yahoo Finance used as a fallback.

## Following the transactions

Paper buys and sells become holdings with an average cost and a portfolio value I can follow over time. Historical simulations keep individual trades and daily snapshots, so I can inspect how a strategy reached its final result.

## Looking beyond the ending value

The analysis includes compound annual growth, volatility, Sharpe ratio, and maximum drawdown. These describe how quickly a portfolio grew, how much returns varied, returns relative to volatility, and the largest peak-to-trough fall. Two simulations can end at a similar value while taking very different paths.

Post-trade analysis also checks prices over several periods after an entry. That gives me another way to examine whether a signal helped, rather than relying on a few memorable winners.

## Collecting the data

A Django app stores the research in PostgreSQL. Celery and Redis run slow collection jobs in the background, responses are validated before storage, and synchronization can resume in batches. Provider fallbacks help with missing records, though the analysis still depends on the data received.

Paperfolio is a private research tool with paper execution. A historical simulation records what the rules would have done on that dataset; it does not establish what a future portfolio will earn.
