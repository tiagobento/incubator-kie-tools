/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Pure logic — no I/O. Every function here is called by cli.ts with
// arguments resolved from disk / git / pnpm / turbo, and is unit-tested.

import { XMLParser } from "fast-xml-parser";

// ---------- types ----------

export type NoneDecision = { mode: "none"; name: string };
export type FullDecision = {
  mode: "full";
  name: string;
  bootstrapPnpmFilterString: string;
  fullBuildPnpmFilterString: string;
};
export type PartialDecision = {
  mode: "partial";
  name: string;
  bootstrapPnpmFilterString: string;
  upstreamPnpmFilterString: string;
  affectedPnpmFilterString: string;
};
export type PartitionDecision = NoneDecision | FullDecision | PartialDecision;

export type PartitionDefinition = {
  name: string;
  leafPackageNames: Set<string>;
  dirs: Set<string>;
};

export type PartitioningIssue =
  | { kind: "non-leaf-packages-in-partitions"; packages: string[] }
  | { kind: "overlapping-partitions"; duplicates: string[] }
  | { kind: "incomplete-partitions"; missingPackageDirs: string[] }
  | { kind: "non-optimal-partial-build"; partition: string };

// ---------- patterns ----------

export function parsePatternFile(contents: string): string[] {
  return contents
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function prefixWithRoots(patterns: string[], roots: string[]): string[] {
  return patterns.flatMap((p) => roots.map((r) => `${r}/${p}`));
}

export function toGitDiffExcludePathspec(patterns: string[]): string {
  return patterns.map((p) => `':!${p}'`).join(" ");
}

export function toFindPathArgs(patterns: string[]): string {
  return patterns.map((p) => `-path '${p}'`).join(" -o ");
}

// ---------- partitioning ----------

export function computeAllLeafPackages(args: {
  packageNames: Iterable<string>;
  /** Links are `source -> target` meaning "source depends on target". Leaves are packages that are never a target. */
  dependencyLinks: Array<{ source: string; target: string }>;
  rootPackageName: string;
}): Set<string> {
  const leaves = new Set(args.packageNames);
  for (const link of args.dependencyLinks) leaves.delete(link.target);
  leaves.delete(args.rootPackageName);
  return leaves;
}

export function validatePartitionDefinitions(args: {
  allLeafPackages: Set<string>;
  partitions: PartitionDefinition[];
  allPackageDirs: Set<string>;
}): PartitioningIssue[] {
  const issues: PartitioningIssue[] = [];

  const declaredLeafNames = args.partitions.flatMap((p) => [...p.leafPackageNames]);

  const nonLeaf = [...new Set(declaredLeafNames.filter((n) => !args.allLeafPackages.has(n)))];
  if (nonLeaf.length > 0) issues.push({ kind: "non-leaf-packages-in-partitions", packages: nonLeaf });

  const duplicates = findDuplicates(declaredLeafNames);
  if (duplicates.length > 0) issues.push({ kind: "overlapping-partitions", duplicates });

  const coveredDirs = new Set<string>();
  for (const p of args.partitions) for (const d of p.dirs) coveredDirs.add(d);
  const missing = [...args.allPackageDirs].filter((d) => !coveredDirs.has(d));
  if (missing.length > 0) issues.push({ kind: "incomplete-partitions", missingPackageDirs: missing });

  return issues;
}

export function checkOptimalPartialBuild(args: {
  partitionName: string;
  upstreamPackageNames: Set<string>;
  affectedPackageNames: Set<string>;
  relevantPackageNames: Set<string>;
}): PartitioningIssue | null {
  const ok = args.upstreamPackageNames.size + args.affectedPackageNames.size === args.relevantPackageNames.size;
  return ok ? null : { kind: "non-optimal-partial-build", partition: args.partitionName };
}

/**
 * Central decision: given pre-computed inputs, decide mode + pnpm filter strings per partition.
 * Every dependency on the outside world is an argument.
 */
export function decidePartitionModes(args: {
  forceFull: boolean;
  partitions: PartitionDefinition[];
  packageNamesByDir: Map<string, string>;
  /** Changed files outside the monorepo's packages-root paths. */
  changedSourcePathsInRoot: string[];
  /** Dirs of packages whose files changed. */
  changedPackageDirs: string[];
  /** Dirs of all packages affected (transitively) by any change, across every partition. */
  affectedPackageDirsInAllPartitions: string[];
  /** Pre-computed, per partition: package names in the affected + upstream set. */
  relevantPackageNamesByPartition: Map<string, Set<string>>;
}): PartitionDecision[] {
  return args.partitions.map((partition): PartitionDecision => {
    if (args.forceFull || args.changedSourcePathsInRoot.length > 0) {
      const filter = toTransitiveDepsFilter([...partition.leafPackageNames]);
      return {
        mode: "full",
        name: partition.name,
        bootstrapPnpmFilterString: filter,
        fullBuildPnpmFilterString: filter,
      };
    }

    const changedInPartition = args.changedPackageDirs.filter((d) => partition.dirs.has(d));
    if (changedInPartition.length === 0) return { mode: "none", name: partition.name };

    const affectedNamesInPartition = new Set<string>();
    for (const dir of args.affectedPackageDirsInAllPartitions) {
      if (!partition.dirs.has(dir)) continue;
      const n = args.packageNamesByDir.get(dir);
      if (n !== undefined) affectedNamesInPartition.add(n);
    }

    const relevant = args.relevantPackageNamesByPartition.get(partition.name) ?? new Set<string>();
    const upstream = new Set<string>();
    for (const n of relevant) if (!affectedNamesInPartition.has(n)) upstream.add(n);

    return {
      mode: "partial",
      name: partition.name,
      bootstrapPnpmFilterString: toExactFilter([...relevant]),
      upstreamPnpmFilterString: toExactFilter([...upstream]),
      affectedPnpmFilterString: toExactFilter([...affectedNamesInPartition]),
    };
  });
}

export function toExactFilter(names: string[]): string {
  return names.map((n) => `-F '${n}'`).join(" ");
}

export function toTransitiveDepsFilter(names: string[]): string {
  return names.map((n) => `-F '${n}...'`).join(" ");
}

function findDuplicates(arr: string[]): string[] {
  const counts = new Map<string, number>();
  for (const x of arr) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n);
}

// ---------- summary ----------

export type SummaryInput = {
  os: string;
  partitionIndex: number;
  partitionDecision: PartitionDecision;
  triggeredBy: "push-main" | "pull-request";
  baseSha: string;
  headSha: string;
  changedSourcePathsInRoot: string[];
  changedPackageNames: string[];
};

export function renderBuildSummary(input: SummaryInput): string {
  const d = input.partitionDecision;
  const modeEmoji = d.mode === "full" ? "🏗️" : d.mode === "partial" ? "🧩" : "⏭️";

  return [
    `# ${modeEmoji} Build summary — \`${input.os}\` / partition ${input.partitionIndex}`,
    ``,
    `**Mode:** \`${d.mode}\` — ${reasonForMode(input)}`,
    `**Trigger:** ${input.triggeredBy === "push-main" ? "push to `main`" : "pull request"}`,
    `**Range:** \`${short(input.baseSha)}...${short(input.headSha)}\``,
    ``,
    renderWhatRan(d),
    ``,
    renderReproduceLocally(d),
    ``,
    renderChanged(input),
  ].join("\n");
}

function reasonForMode(input: SummaryInput): string {
  const d = input.partitionDecision;
  if (d.mode === "full") {
    if (input.changedSourcePathsInRoot.length > 0) {
      return `changes outside package roots were detected (${input.changedSourcePathsInRoot.length} file(s)), forcing a full build`;
    }
    return `a full build was forced for this run`;
  }
  if (d.mode === "none") return `no changes affect packages in this partition, so nothing was built`;
  return `only a subset of this partition's packages were affected; their upstream + downstream were built`;
}

function renderWhatRan(d: PartitionDecision): string {
  if (d.mode === "none") return `## What ran\n\n_Nothing_ — this partition had no affected packages.`;
  const lines = [`## What ran`, ``, `**Bootstrap filter:** \`${d.bootstrapPnpmFilterString || "(none)"}\``];
  if (d.mode === "full") {
    lines.push(`**Full-build filter:** \`${d.fullBuildPnpmFilterString || "(none)"}\``);
  } else {
    lines.push(
      `**Upstream filter (\`build:dev\`):** \`${d.upstreamPnpmFilterString || "(none)"}\``,
      `**Affected filter (\`build:prod\`):** \`${d.affectedPnpmFilterString || "(none)"}\``
    );
  }
  return lines.join("\n");
}

function renderReproduceLocally(d: PartitionDecision): string {
  if (d.mode === "none") {
    return `## Reproduce this build locally\n\nNothing to reproduce — this partition had no affected packages.`;
  }
  const lines = [
    `## Reproduce this build locally`,
    ``,
    `From the repository root, after \`pnpm install\`:`,
    ``,
    "```bash",
    `pnpm bootstrap ${d.bootstrapPnpmFilterString}`,
    ``,
  ];
  if (d.mode === "full") {
    lines.push(`eval "pnpm ${d.fullBuildPnpmFilterString} --workspace-concurrency=1 build:prod"`, "```");
  } else {
    lines.push(
      `eval "pnpm ${d.upstreamPnpmFilterString} --if-present build:dev"`,
      `eval "pnpm ${d.affectedPnpmFilterString} --if-present --workspace-concurrency=1 build:prod"`,
      "```"
    );
  }
  lines.push(
    ``,
    `> Set \`KIE_TOOLS_BUILD__runTests=false\` / \`KIE_TOOLS_BUILD__runLinters=false\` to skip tests and linters while reproducing.`
  );
  return lines.join("\n");
}

function renderChanged(input: SummaryInput): string {
  const out: string[] = [`## Changes that drove this decision`, ``];
  if (input.changedSourcePathsInRoot.length > 0) {
    out.push(`**Outside package roots** (${input.changedSourcePathsInRoot.length}):`, ``);
    out.push(...truncate(input.changedSourcePathsInRoot, 20).map((p) => `- \`${p}\``));
    out.push(``);
  }
  if (input.changedPackageNames.length > 0) {
    out.push(`**Changed packages** (${input.changedPackageNames.length}):`, ``);
    out.push(...truncate(input.changedPackageNames, 20).map((n) => `- \`${n}\``));
  }
  if (input.changedSourcePathsInRoot.length === 0 && input.changedPackageNames.length === 0) {
    out.push(`_No changes detected in this range._`);
  }
  return out.join("\n");
}

function truncate(list: string[], limit: number): string[] {
  if (list.length <= limit) return list;
  return [...list.slice(0, limit), `_...and ${list.length - limit} more_`];
}

function short(sha: string): string {
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

// ---------- junit ----------

export type JunitTestCase = Record<string, unknown> & {
  "@_name"?: string;
  failure?: { "#text"?: string } | string;
  error?: { "#text"?: string } | string;
};

export type JunitParseResult = { failed: JunitTestCase[]; passed: JunitTestCase[] };

const JUNIT_ARRAY_PATHS = new Set(["testsuites.testsuite", "testsuites.testsuite.testcase", "testsuite.testcase"]);

const junitParser = new XMLParser({
  ignoreAttributes: false,
  isArray: (_tagName: string, jPath: string) => JUNIT_ARRAY_PATHS.has(jPath),
});

/** Parse a JUnit XML document and accumulate passing/failing test cases into `result`. */
export function parseJunitReport(xml: string, result: JunitParseResult): void {
  const doc = junitParser.parse(xml);
  const testSuites = doc["testsuites"] ?? { testsuite: [doc["testsuite"]] };
  if (typeof testSuites !== "object") throw new Error("Can't parse 'testsuites'");

  for (const key in testSuites) {
    if (key.startsWith("@_")) continue;
    const contents = testSuites[key];
    if (!Array.isArray(contents)) continue;

    for (const suite of contents) {
      if (typeof suite !== "object" || suite === null) continue;
      const testCases = suite["testcase"];
      if (!testCases) continue;
      if (!Array.isArray(testCases)) throw new Error("Can't parse 'testcase' array");

      for (const tc of testCases as JunitTestCase[]) {
        if (typeof tc !== "object" || tc === null) continue;
        const failure = tc.failure ?? tc.error;
        if (!failure) {
          result.passed.push(tc);
          continue;
        }
        if (typeof failure === "object") {
          result.failed.push(tc);
        } else if (typeof failure === "string") {
          result.failed.push({ ...tc, failure: { "#text": failure } });
        } else {
          throw new Error(`Can't parse 'failure': ${JSON.stringify(failure, null, 2)}.`);
        }
      }
    }
  }
}

export function renderJunitFailureReport(failed: JunitTestCase[]): string {
  const lines: string[] = [];
  for (const tc of failed) {
    const fail = (tc.failure ?? tc.error) as { "#text"?: string } | undefined;
    lines.push(`TEST FAILED: ${tc["@_name"] ?? "(unnamed)"}`);
    lines.push(fail?.["#text"] ?? "");
    lines.push("-------------------------------------------------");
    lines.push("");
  }
  return lines.join("\n");
}
