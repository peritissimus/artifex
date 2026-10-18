---
title: 'Who Are Our Frameworks For Now?'
date: 2026-10-18
author: Kushal Patankar
category: AI/LLM
tags: [AI Coding, Software Engineering, Frameworks]
description: Whether frameworks built around human programmers still make sense for AI coding, and what a safe change asks of either.
readTime: 4 min read
draft: false
---

I keep coming back to a question about AI coding: if an agent writes much of the implementation, should we still organize software around the same conveniences we designed for ourselves?

A framework decides what we write explicitly and what can remain a convention. It gives us somewhere to put a feature, a way to share behavior, and a set of assumptions we do not have to explain every time.

Those decisions are worth revisiting. A structure that makes a project comfortable for a human team might not be the easiest one for an agent to change safely. But being built for people does not make a framework obsolete, either.

## What we still need from a framework

Some abstractions save us from work that matters regardless of who writes the code. Django's querysets, for example, use [parameterized queries to protect against SQL injection](https://docs.djangoproject.com/en/5.2/topics/security/#sql-injection-protection). Generating a replacement would mean taking responsibility for the protection it provided.

The organizational parts can help too. A consistent way to declare a route or validate an input gives an agent a pattern to follow. I would not discard that just because the agent can produce more code.

What interests me is the information an abstraction leaves out of sight. How much must the programmer already know before a small change is safe?

Imagine an administrator-only users page. We ask an agent to add a CSV export. It creates a button and a server endpoint, and the file downloads when an administrator clicks it.

This is a hypothetical example, but it exposes a specific problem: the endpoint is another way to access the data. Protecting the page does not establish that the export is protected. Someone could call it directly.

The requirement belongs to every server entry point that returns that data. The visible feature is only part of the change.

I want to know where the agent would discover that requirement. Is it enforced through a shared policy? Can the agent inspect which handlers use it? Is there a test that rejects an unauthorized request? Or is this something an experienced developer remembers to check?

A framework could make that relationship clear and enforceable. It could also leave it scattered across configuration and conventions. Removing the framework would not settle the question. Handwriting the same check in several places creates another opportunity for the implementations to drift.

## Familiar is not necessarily the best fit

An agent recommending a familiar stack does not tell me whether it compared the alternatives. It might be a sensible choice with good documentation and tooling. It might also be a default that has not been examined for this particular application.

I would be just as cautious about a new framework described as agent-native. It still needs to make its behavior understandable, and a person still has to maintain the software it helps produce.

There is a useful parallel in Anthropic's [work on tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents). It describes designing interfaces around limited context, relevant responses, and explicit inputs, rather than assuming an existing API is already the right interface for an agent.

That work concerns tools, not application frameworks. I think the question transfers, even if the answer does not: which information should the interface make available when a decision depends on it?

For the export feature, a way to inspect effective permissions might help more than a shorter syntax for declaring the endpoint. That capability could sit inside an existing framework.

## The next edit is the more interesting test

I would learn more from asking an agent to modify an existing application than from watching it scaffold a new one.

For the export example, I would compare two versions of the same application, using the same framework and permission policy. One would expose which handlers the policy protects; the other would leave that relationship to the framework's usual conventions.

The same agent would get the same feature request, comparable documentation, and a similar budget, across repeated runs. Tests written independently of the agent would check that administrators can export, signed-out and non-admin users cannot, and existing behavior survives. Human review would examine whether the protection is understandable and what needs correcting. Time and cost belong in the comparison too.

I have not run this experiment. The explicit version might help, or the framework's conventions might already be the clearest option. Better repository documentation could matter more than either design.

My suspicion is that human-friendly and agent-friendly software will overlap considerably. I want visible dependencies, useful errors, and rules I can verify when I am maintaining code too.

Perhaps we need to be more deliberate about what we leave implicit. Before replacing a framework, I would take one ordinary change and ask which existing rule it could accidentally bypass. Then I would check whether the framework gives both the agent and me a clear way to find and enforce that rule.
