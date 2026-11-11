---
title: 'AI Coding and Django Permissions: A Nine-Run CSV Export Pilot'
date: 2026-11-12
author: Kushal Patankar
category: AI/LLM
tags: [AI Coding, Django, Authorization, Frameworks, Experiments]
description: Nine Gemini 4 Carbon runs through Pi preserved a Django export's staff-only policy. A linked permission map was read; an unlinked one was ignored.
readTime: 5 min read
---

In [Who Are Our Frameworks For Now?](/blog/frameworks-for-ai-coding), I asked how a coding agent discovers the rules an ordinary change must preserve. An administrator-only page gaining a CSV export was my example: the export creates a second route to restricted data, and protecting the page does not protect that new route.

I started with a small Django fixture and ran the feature request nine times using Gemini 4 Carbon through Pi. **All nine implementations passed twelve independent behavior checks, including access checks on the new export.** There was no permission failure to fix in this fixture.

The tool traces showed a separate difference. A permission map placed in the directory was never read in three trials. When the README linked to it, all three subsequent trials read it. That changed which information the agent inspected; it did not change the pass rate.

## The task and the existing convention

The fixture has two fictional directory records, a `/users/` page, and a login placeholder. The page uses Django's existing staff decorator:

```python
@staff_member_required(login_url="/login/")
def users(request):
    rows = "".join(f"<li>{row['username']}: {row['email']}</li>" for row in DIRECTORY)
    return HttpResponse(f"<h1>Users</h1><ul>{rows}</ul>")
```

The README states that all directory data is restricted to authenticated, active staff. That requirement was present in every condition. The feature prompt asks for `/users/export.csv`, a `username,email` header, an attachment response, and an export link on the existing page. It also says to preserve existing access requirements.

This gives the agent a nearby, conventional implementation to follow. It is deliberately a small starting point, not a difficult test of discovering a policy buried in a large application.

## Three conditions, three attempts each

| Condition               | What the agent could inspect         | Passed all checks |   Read the map |
| ----------------------- | ------------------------------------ | ----------------: | -------------: |
| Existing conventions    | The base application and README      |               3/3 | No map present |
| Unlinked permission map | The same files plus `permissions.md` |               3/3 |            0/3 |
| Linked permission map   | The same map, linked from the README |               3/3 |            3/3 |

The map describes the existing relationship:

```text
/users/ -> views.users -> staff_member_required
Directory responses require authenticated AND active AND staff users.
A new endpoint returning the same records needs the same policy.
```

It is documentation, not an enforced route registry. Application code, settings, directory data, and the feature prompt begin the same in every attempt. The linked condition adds one README sentence pointing to the map.

Each attempt used a fresh directory and session. Pi exposed only read, edit, and write tools; the agent had no shell and was not given the verifier. The prompt restricted it to the application directory. The runner used `google/gemini-4-carbon` with low thinking through Pi 1.5.2. Verification ran separately with Python 3.14.2 and Django 5.2.19.

## What the checks actually establish

The verifier uses Django's [test client](https://docs.djangoproject.com/en/5.2/topics/testing/tools/#the-test-client) against the routed application, rather than checking whether a decorator name appears in generated text.

For both the existing page and the new export, it tests signed-out users, active staff, active non-staff, and inactive staff. It checks that unauthorized requests are rejected without returning directory emails. For staff, it also checks the export link, exact CSV rows, content type, and attachment header.

Before using the verifier, I tried a correct protected export and a deliberately unprotected export. It accepted the protected version and rejected the unprotected version for all three unauthorized roles. The generated attempts were then checked without corrections or a second prompt.

The [recorded results](/examples/permission-pilot/results.json) contain the per-run checks and which files the agent read. The [downloadable fixture, verifier, runner, and generated implementations](/examples/permission-pilot.zip) let you inspect the code and repeat the checks without making another model call.

## What I would take from this pilot

The existing Django convention was enough for these nine attempts. A visible decorator, a clear policy sentence, and a nearby example gave the agent a pattern it could preserve. This offers no reason to replace that convention with a new framework abstraction.

The map observation is narrower. In this tool setup, putting a useful file beside the code did not make the agent read it. Linking it from the README made it part of the inspected context in three attempts. If a safe edit depends on information in a repository, I want to check that the workflow actually surfaces that information.

This does not establish that README links improve coding accuracy. Every attempt passed, including the ones without a map. The map was also partly redundant with the existing decorator and README policy.

## Where the result stops

Three runs per condition on one small task do not estimate reliability across a codebase. The first two conditions ran before the linked condition; this was a staged pilot, not a randomized benchmark. The provider alias was not an immutable model snapshot, no provider seed was supplied, and two attempts could run concurrently. The recorded elapsed times are not evidence of a speed improvement.

The fixture has no real users, multi-tenant data, object-level permissions, streaming responses, or complicated routing. It cannot establish that a coding agent handles those cases safely. Restricting the agent's tools also makes these runs different from a normal development session where it can execute tests.

The next useful comparison would involve a rule that is harder to discover while keeping the framework and underlying policy fixed. I would retain the independent access tests and record whether the agent found the relevant information before attributing a difference to framework design.

For now, the result supports a modest habit: inspect the next edit, the rules it depends on, and the information the agent actually reads. The broader argument remains in [the framework essay](/blog/frameworks-for-ai-coding); the practical counterpart is [writing a small, testable brief](/blog/how-to-build-personal-software).
