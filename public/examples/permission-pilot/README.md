# Django permission pilot

Recorded on November 12, 2026 with Pi 1.5.2, google/gemini-4-carbon, low
thinking, Python 3.14.2 and Django 5.2.19. Every account and directory record
is fictional. The settings, weak password hasher, and fixed secret belong to
this in-memory test fixture; do not use this application as a deployed starter.

## Verify a recorded implementation without calling a model

Download and unzip `permission-pilot.zip`, then run these commands from the
extracted directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python verify.py recorded/conventions-1
```

The verifier creates a fresh in-memory database and checks twelve outcomes:
page/export access for signed-out, staff, non-staff and inactive users, the
export link, CSV rows, content type, and attachment header. `results.json`
contains the recorded outcomes and tool-read observations for all nine runs.

## Run a fresh pilot

Install Pi and configure its Google provider first. The runner starts nine
model sessions, three per condition, so this consumes provider usage. It
permits file reads and edits but does not provide the agent a shell or the
verifier. Choose a new output directory:

```sh
.venv/bin/python run.py --out fresh-runs
```

Use `--variant conventions`, `--variant permission-map`, or
`--variant linked-permission-map` to run only one condition. The base README
already states the staff-only rule. The second condition adds a permission
map without linking it. The third links that map from the README.

The first six recorded runs preceded the three linked-map runs. They were
not a randomized simultaneous experiment. Two runs were allowed concurrently;
elapsed times are descriptive and should not be interpreted as latency gains.
Pi's model alias is not an immutable model snapshot and no provider seed was
specified. Three runs per condition cannot establish reliability in a larger
application or support a general claim about which framework is best.
