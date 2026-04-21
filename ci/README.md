<!--
  Licensed to the Apache Software Foundation (ASF) under one
  or more contributor license agreements.  See the NOTICE file
  distributed with this work for additional information
  regarding copyright ownership.  The ASF licenses this file
  to you under the Apache License, Version 2.0 (the
  "License"); you may not use this file except in compliance
  with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, either express or implied.  See the License for the
  specific language governing permissions and limitations
  under the License.
-->

# @kie-tools/ci

Pre-build CI tooling for kie-tools. Runs **before** `pnpm bootstrap` as part of the GitHub Actions build, so it is intentionally kept as a standalone project — **not** a pnpm workspace member — to avoid a chicken-and-egg dependency on the very build it orchestrates.

## Why it exists

The old CI had logic scattered across:

- `.github/supporting-files/ci/build-partitioning/` (Bun scripts)
- `.github/supporting-files/ci/patterns/` (txt files, read by YAML)
- `.github/actions/setup-ci-patterns/` (github-script inside action.yml)
- `.github/actions/bootstrap/` (inline bash + cache key calc)
- `.github/actions/upload-ci-reports-and-artifacts/` (composite action)
- `scripts/check-junit-report-results/` (separate workspace package for JUnit parsing)

That scatter made it hard to reason about the pipeline, impossible to test in isolation, and friction-heavy to develop locally. This project consolidates that logic into **two files**:

- `src/core.ts` — pure logic, no I/O, every function unit-tested (partitioning, pattern parsing, build-summary rendering, JUnit XML parsing)
- `src/cli.ts` — CLI dispatcher + command handlers that glue `core.ts` to git/pnpm/turbo/fs

Some workflow steps have been inlined directly in `ci.yaml` for simplicity.

## Local development

```bash
cd ci
npm ci                   # installs dependencies with integrity verification
bun test                 # runs the pure-logic unit tests
npm run typecheck        # typechecks
```

## Running a command locally

Every command `ci.yaml` invokes can be run from your machine:

```bash
# From repo root:
npm run --prefix ci cli -- --help

npm run --prefix ci cli -- setup-patterns --outputPath=/tmp/ci-patterns.json

npm run --prefix ci cli -- build-mode \
  --forceFull=false \
  --baseSha=$(git merge-base HEAD main) \
  --headSha=HEAD \
  --graphJsonPath=./repo/graph.json \
  --outputPath=/tmp/partitions.json

npm run --prefix ci cli -- summary \
  --partitionsJsonPath=/tmp/partitions.json \
  --partitionIndex=0 \
  --os=Linux \
  --triggeredBy=pull-request \
  --outputPath=/tmp/build-summary.md

npm run --prefix ci cli -- check-junit-reports --patternsJsonPath=/tmp/ci-patterns.json
```

## Commands

| Command               | Purpose                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `build-mode`          | Decide per-partition build mode (`full`, `partial`, `none`) + filters |
| `setup-patterns`      | Resolve glob/ignore/report patterns for the workflow                  |
| `summary`             | Produce a markdown build summary + local-reproduction instructions    |
| `check-junit-reports` | Validate JUnit XML reports and fail if any tests failed               |

Every command takes `--help` to list its flags.
