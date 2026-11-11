---
title: 'Who Are Our Frameworks For Now?'
seoTitle: 'Frameworks for AI Coding: What Should Stay Implicit?'
date: 2026-10-18
updated: 2026-11-12
author: Kushal Patankar
category: AI/LLM
tags: [AI Coding, Software Engineering, Frameworks]
description: How framework conventions shape AI code changes, with an admin-only CSV export example and a test plan for checking permissions.
readTime: 4 min read
draft: false
---

I keep coming back to one question about AI coding: if an agent writes much of the implementation, should we still organize software around the conveniences we originally built for ourselves?

Frameworks decide what we write explicitly and what we can rely on as a convention. They give features a place to go, a way to share behavior, and assumptions we do not have to restate in every file.

Those tradeoffs are worth revisiting now. A project structure that feels comfortable for a human team might not be the easiest one for an agent to modify safely. At the same time, the fact that a framework was designed for people does not automatically make it obsolete.

## What we still need from a framework

For AI coding, I would judge a framework by whether both the agent and the human reviewer can find the rules a change must preserve. Shorter syntax matters less if permissions, dependencies, or failure behavior are difficult to inspect. This is also why a [small, testable implementation brief](/blog/how-to-build-personal-software) matters before the first generated file.

Some abstractions do work we still need, whoever writes the code. Django's querysets, for example, use [parameterized queries to protect against SQL injection](https://docs.djangoproject.com/en/5.2/topics/security/#sql-injection-protection). Asking an agent to generate a custom replacement would just shift the burden of maintaining that protection onto us.

A framework's structure helps in ordinary ways, too. Having one standard way to declare a route or validate input gives an agent a clear pattern to copy. I would not throw away that consistency just because an agent can generate boilerplate quickly.

What concerns me is the context an abstraction hides. How much does a programmer or an agent already need to know to make a small change safely?

Take a hypothetical example: suppose we have an administrator-only users page, and we ask an agent to add a CSV export. The agent adds a button and a new server endpoint. When an admin clicks the button, the file downloads as expected.

The new endpoint creates another path to the same restricted data. Protecting the page does not tell us whether the export is protected: someone could call its URL directly. The access rule has to apply to every server entry point that returns those records.

What I want to know is how an agent is supposed to discover that rule. Is access enforced through a shared policy? Can the agent inspect the codebase to see which handlers use that policy? Is there a test that rejects unauthorized requests, or does protection depend on an experienced developer remembering to check?

A framework can make those relationships explicit and enforceable, or it can scatter them across config files and naming conventions. Ditching the framework does not solve this, either. Writing the same authorization check by hand in multiple places just creates new opportunities for those implementations to drift apart.

## Familiar is not necessarily the best fit

An agent recommending a familiar stack does not tell me whether it compared the alternatives. The stack might be a good choice with useful documentation and tooling. It might also be a default the agent has not evaluated for this application.

I am equally skeptical of new frameworks described as agent-native. Any framework still has to make its behavior legible, because a human still has to maintain and debug the software it produces.

There is a useful parallel here in Anthropic's [work on tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents). They describe designing tool interfaces around limited context windows, focused responses, and explicit inputs, rather than assuming an existing API is already the right fit for an agent.

Their post concerns agent tools, not application frameworks. I think the question carries over, even if the answer does not: when a safe change depends on existing context, how does the interface help us find it?

In that CSV export scenario, giving the agent a clear way to inspect effective route permissions might help more than offering a terser syntax for declaring endpoints. And there is no reason that kind of visibility could not live inside an existing framework.

## The next edit is the more interesting test

I would learn more from asking an agent to modify an existing application than from watching it scaffold a new one.

If I were going to test the CSV export scenario, I would set up two versions of the same application, built on the same framework and underlying permission policy. One version would explicitly expose which handlers are covered by the policy; the other would rely on the framework's standard conventions.

From there, I would run the same agent across repeated trials with the same feature prompt, comparable documentation, and a similar budget. An independent test suite—written separately from the agent—would verify that admins can export the CSV, signed-out and non-admin users get rejected, and no existing behavior breaks. Alongside tracking time and cost, a human reviewer would evaluate how easy the resulting protection is to understand and how much cleanup it needs.

I have not run that full comparison. I started with a [nine-run Django permissions pilot](/blog/ai-coding-django-permissions-pilot): every generated export passed the access checks. An unlinked permission map was ignored; linking it from the README caused the agent to read it, without changing the pass rate. That small result does not settle which framework design is better. It does make me want to inspect the information the agent actually sees before crediting an abstraction for the outcome.

Still, I suspect that human-friendly and agent-friendly software overlap a lot. When I am maintaining an unfamiliar part of a codebase, I want visible dependencies, useful error messages, and verifiable rules just as much as an agent does.

Perhaps we need to be more deliberate about what we leave implicit. Before replacing a framework, I would take an ordinary feature change, ask which existing rules it could accidentally bypass, and check whether both the agent and I can find and enforce those rules.
