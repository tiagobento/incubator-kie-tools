#!/usr/bin/env bun
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

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { parseArgs } from "util";
import {
  checkOptimalPartialBuild,
  computeAllLeafPackages,
  decidePartitionModes,
  parseJunitReport,
  parsePatternFile,
  prefixWithRoots,
  renderBuildSummary,
  renderJunitFailureReport,
  toFindPathArgs,
  toGitDiffExcludePathspec,
  validatePartitionDefinitions,
  type JunitParseResult,
  type PartitionDecision,
  type PartitionDefinition,
} from "./core";

const ROOT_PKG_NAME = "kie-tools-root";
/** A change in any of these paths forces a full build (they're not under packages/examples). */
const PACKAGES_ROOT_PATHS = ["packages/", "examples/", "repo/", "pnpm-lock.yaml"];

const USAGE = `
@kie-tools/ci — pre-build CI tooling

Usage: bun ci/src/cli.ts <command> [flags]

Commands:
  build-mode            Decide partition modes + pnpm filter strings
  setup-patterns        Resolve glob/report patterns used by the workflow
  summary               Render a markdown build summary with local-reproduction steps
  check-junit-reports   Glob JUnit XML reports and fail if any test case failed

Run \`bun ci/src/cli.ts <command> --help\` for per-command flags.
`;

// ---------- dispatcher ----------

async function main(): Promise<number> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "-h" || cmd === "--help") {
    console.log(USAGE);
    return cmd ? 0 : 2;
  }
  switch (cmd) {
    case "build-mode":
      return runBuildMode(rest);
    case "setup-patterns":
      return runSetupPatterns(rest);
    case "summary":
      return runSummary(rest);
    case "check-junit-reports":
      return runCheckJunitReports(rest);
    default:
      console.error(`unknown command: '${cmd}'`);
      console.error(USAGE);
      return 2;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// ---------- setup-patterns ----------

async function runSetupPatterns(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      patternsDir: { type: "string", default: "ci/patterns" },
      rootPaths: { type: "string", default: "packages,examples" },
      outputPath: { type: "string" },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });
  if (values.help) {
    console.log(`Usage: setup-patterns --outputPath=PATH [--patternsDir=DIR] [--rootPaths=A,B,...]`);
    return 0;
  }
  if (!values.outputPath) return fail("setup-patterns: --outputPath is required");

  const dir = path.resolve(values.patternsDir!);
  const rootPaths = values
    .rootPaths!.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const read = (f: string) => parsePatternFile(fs.readFileSync(path.join(dir, f), "utf8"));

  const nonSourceFiles = read("non-source-files.txt");
  const testsSourceFiles = read("tests-source-files.txt");
  const testsReports = read("tests-reports.txt");
  const e2eReports = read("end-to-end-tests-reports.txt");
  const e2eArtifacts = read("end-to-end-tests-artifacts.txt");
  const buildArtifacts = read("build-artifacts.txt");

  fs.writeFileSync(
    values.outputPath,
    JSON.stringify(
      {
        rootPaths,
        nonSourceFiles,
        nonSourceFilesForGitDiff: toGitDiffExcludePathspec(nonSourceFiles),
        testsSourceFiles,
        testsReports: prefixWithRoots(testsReports, rootPaths),
        endToEndTestsReports: prefixWithRoots(e2eReports, rootPaths),
        endToEndTestsArtifacts: prefixWithRoots(e2eArtifacts, rootPaths),
        buildArtifacts: prefixWithRoots(buildArtifacts, rootPaths),
        endToEndTestsReportsForFind: toFindPathArgs(prefixWithRoots(e2eReports, rootPaths)),
      },
      null,
      2
    )
  );
  console.log(`[setup-patterns] Wrote ${values.outputPath}`);
  return 0;
}

// ---------- build-mode ----------

async function runBuildMode(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      forceFull: { type: "string", default: "false" },
      baseSha: { type: "string" },
      headSha: { type: "string" },
      graphJsonPath: { type: "string" },
      partition: { type: "string", multiple: true, default: [] },
      outputPath: { type: "string" },
      partitionIndex: { type: "string" },
      patternsDir: { type: "string", default: "ci/patterns" },
      tmpPartitionFilterPath: { type: "string", default: "/tmp/partition-filter.txt" },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });
  if (values.help) {
    console.log(
      `Usage: build-mode --baseSha=SHA --headSha=SHA --graphJsonPath=PATH --outputPath=PATH [--forceFull=true|false] [--partition=FILE]... [--partitionIndex=N]`
    );
    return 0;
  }
  for (const k of ["baseSha", "headSha", "graphJsonPath", "outputPath"] as const) {
    if (!values[k]) return fail(`build-mode: --${k} is required`);
  }

  const forceFull = values.forceFull === "true";
  const baseSha = values.baseSha!;
  const headSha = values.headSha!;
  const repoRoot = path.dirname(path.dirname(__dirname));
  const tmp = values.tmpPartitionFilterPath!;

  const getDirs = (names: Set<string>): Set<string> => {
    if (names.size === 0) return new Set();
    // Write filter to a file to dodge Windows' 8191-char command-line limit.
    fs.writeFileSync(tmp, [...names].map((n) => `-F ${n}...`).join(" "));
    return new Set(
      stdoutArray(execSync(`bash -c "pnpm $(cat ${tmp}) exec bash -c pwd"`, { cwd: repoRoot }).toString()).map((d) =>
        toRepoRel(d, repoRoot)
      )
    );
  };

  // 1. Graph + leaves
  const graph = JSON.parse(fs.readFileSync(path.resolve(values.graphJsonPath!), "utf8"));
  const packageDirsByName = new Map<string, string>(graph.serializedPackagesLocationByName);
  const packageNamesByDir = new Map([...packageDirsByName.entries()].map(([k, v]) => [v, k]));
  const allLeafPackages = computeAllLeafPackages({
    packageNames: packageDirsByName.keys(),
    dependencyLinks: graph.serializedDatavisGraph.links,
    rootPackageName: ROOT_PKG_NAME,
  });

  // 2. Partitions (declared files + remaining leaves)
  const declared = new Set<string>();
  const partitions: PartitionDefinition[] = [];
  for (const pf of values.partition!) {
    const names = new Set(parsePatternFile(fs.readFileSync(path.resolve(pf), "utf8")));
    for (const n of names) declared.add(n);
    partitions.push({ name: pf, leafPackageNames: names, dirs: getDirs(names) });
  }
  const remaining = new Set([...allLeafPackages].filter((n) => !declared.has(n)));
  partitions.push({
    name: "Partition N (remaining leaf packages)",
    leafPackageNames: remaining,
    dirs: getDirs(remaining),
  });

  // 3. Validate
  const allPackageDirs = new Set(
    stdoutArray(execSync(`bash -c "pnpm -F !${ROOT_PKG_NAME}... exec bash -c pwd"`, { cwd: repoRoot }).toString()).map(
      (d) => toRepoRel(d, repoRoot)
    )
  );
  const issues = validatePartitionDefinitions({ allLeafPackages, partitions, allPackageDirs });
  if (issues.length > 0) {
    console.error(`[build-mode] ❌ Partition definitions have ${issues.length} issue(s):`);
    for (const i of issues) console.error(`  ${JSON.stringify(i)}`);
    return 1;
  }

  // 4. Changed paths + packages
  const nonSource = parsePatternFile(
    fs.readFileSync(path.join(path.resolve(values.patternsDir!), "non-source-files.txt"), "utf8")
  );
  const changedSourcePaths = stdoutArray(
    execSync(`bash -c "git diff --name-only ${baseSha} ${headSha} -- ${toGitDiffExcludePathspec(nonSource)}"`, {
      cwd: repoRoot,
    }).toString()
  );
  const changedSourcePathsInRoot = changedSourcePaths.filter((p) => PACKAGES_ROOT_PATHS.every((r) => !p.startsWith(r)));

  const changedPackages: Array<{ path: string; name: string }> = JSON.parse(
    execSync(`bash -c "turbo ls --filter='[${baseSha}...${headSha}]' --output json"`, { cwd: repoRoot }).toString()
  ).packages.items.map((i: { path: string; name: string }) => ({ path: toRepoRel(i.path, repoRoot), name: i.name }));
  const changedPackageDirs = changedPackages.map((p) => p.path);
  const changedPackageNames = changedPackages.map((p) => p.name);

  // 5. Affected (changed + downstream) — chunked for Windows command-line limit.
  const affectedDirs = new Set<string>();
  for (let i = 0; i < changedPackageNames.length; i += 50) {
    const chunk = changedPackageNames.slice(i, i + 50);
    const out = JSON.parse(
      execSync(`bash -c "turbo ls ${chunk.map((n) => `-F '...${n}'`).join(" ")} --output json"`, {
        cwd: repoRoot,
      }).toString()
    );
    for (const item of out.packages.items) affectedDirs.add(toRepoRel(item.path, repoRoot));
  }
  const affectedPackageDirsInAllPartitions = [...affectedDirs];

  // 6. Relevant per partition + defensive optimal-partial check
  const relevantPackageNamesByPartition = new Map<string, Set<string>>();
  for (const p of partitions) {
    const affectedNames = new Set<string>();
    for (const d of affectedPackageDirsInAllPartitions) {
      if (!p.dirs.has(d)) continue;
      const n = packageNamesByDir.get(d);
      if (n !== undefined) affectedNames.add(n);
    }
    const relevantNames = new Set<string>();
    for (const d of getDirs(affectedNames)) {
      const n = packageNamesByDir.get(d);
      if (n !== undefined) relevantNames.add(n);
    }
    relevantPackageNamesByPartition.set(p.name, relevantNames);

    if (!forceFull && changedSourcePathsInRoot.length === 0) {
      const upstream = new Set([...relevantNames].filter((n) => !affectedNames.has(n)));
      const issue = checkOptimalPartialBuild({
        partitionName: p.name,
        upstreamPackageNames: upstream,
        affectedPackageNames: affectedNames,
        relevantPackageNames: relevantNames,
      });
      if (issue) {
        console.error(`[build-mode] ❌ ${JSON.stringify(issue)}`);
        return 1;
      }
    }
  }

  // 7. Decide + emit
  const decisions = decidePartitionModes({
    forceFull,
    partitions,
    packageNamesByDir,
    changedSourcePathsInRoot,
    changedPackageDirs,
    affectedPackageDirsInAllPartitions,
    relevantPackageNamesByPartition,
  });

  fs.writeFileSync(
    values.outputPath!,
    JSON.stringify(
      { meta: { baseSha, headSha, forceFull, changedSourcePathsInRoot, changedPackageNames }, partitions: decisions },
      null,
      2
    )
  );
  console.log(`[build-mode] Wrote ${values.outputPath}`);

  if (values.partitionIndex !== undefined) {
    const d = decisions[Number(values.partitionIndex)];
    if (!d) return fail(`build-mode: partitionIndex=${values.partitionIndex} out of range`);
    emitOutputs({
      mode: d.mode,
      bootstrapPnpmFilterString: d.mode === "none" ? "" : d.bootstrapPnpmFilterString,
      fullBuildPnpmFilterString: d.mode === "full" ? d.fullBuildPnpmFilterString : "",
      upstreamPnpmFilterString: d.mode === "partial" ? d.upstreamPnpmFilterString : "",
      affectedPnpmFilterString: d.mode === "partial" ? d.affectedPnpmFilterString : "",
    });
  }
  return 0;
}

// ---------- summary ----------

async function runSummary(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      partitionsJsonPath: { type: "string" },
      partitionIndex: { type: "string" },
      os: { type: "string" },
      triggeredBy: { type: "string" },
      outputPath: { type: "string" },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });
  if (values.help) {
    console.log(
      `Usage: summary --partitionsJsonPath=PATH --partitionIndex=N --os=NAME --triggeredBy=MODE --outputPath=PATH`
    );
    return 0;
  }
  for (const k of ["partitionsJsonPath", "partitionIndex", "os", "triggeredBy", "outputPath"] as const) {
    if (!values[k]) return fail(`summary: --${k} is required`);
  }
  if (values.triggeredBy !== "push-main" && values.triggeredBy !== "pull-request") {
    return fail(`summary: --triggeredBy must be 'push-main' or 'pull-request'`);
  }

  const doc = JSON.parse(fs.readFileSync(path.resolve(values.partitionsJsonPath!), "utf8")) as {
    meta: {
      baseSha: string;
      headSha: string;
      forceFull: boolean;
      changedSourcePathsInRoot: string[];
      changedPackageNames: string[];
    };
    partitions: PartitionDecision[];
  };
  const idx = Number(values.partitionIndex);
  const decision = doc.partitions[idx];
  if (!decision) return fail(`summary: partitionIndex=${idx} out of range`);

  const markdown = renderBuildSummary({
    os: values.os!,
    partitionIndex: idx,
    partitionDecision: decision,
    triggeredBy: values.triggeredBy as "push-main" | "pull-request",
    baseSha: doc.meta.baseSha,
    headSha: doc.meta.headSha,
    changedSourcePathsInRoot: doc.meta.changedSourcePathsInRoot,
    changedPackageNames: doc.meta.changedPackageNames,
  });
  fs.writeFileSync(values.outputPath!, markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown.endsWith("\n") ? markdown : `${markdown}\n`);
  }
  console.log(`[summary] Wrote ${values.outputPath}`);
  return 0;
}

// ---------- check-junit-reports ----------

async function runCheckJunitReports(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      patternsJsonPath: { type: "string" },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });
  if (values.help) {
    console.log(`Usage: check-junit-reports --patternsJsonPath=PATH`);
    return 0;
  }
  if (!values.patternsJsonPath) return fail("check-junit-reports: --patternsJsonPath is required");

  const doc = JSON.parse(fs.readFileSync(path.resolve(values.patternsJsonPath), "utf8")) as {
    testsReports: string[];
    endToEndTestsReports: string[];
  };
  const patterns = [...doc.testsReports, ...doc.endToEndTestsReports];

  console.log("JUnit Report patterns:");
  console.log(patterns);
  console.log("----\n\n");

  const result: JunitParseResult = { failed: [], passed: [] };
  const seen = new Set<string>();
  for (const pattern of patterns) {
    const glob = new Bun.Glob(pattern);
    for (const filePath of glob.scanSync({ cwd: ".", absolute: true, onlyFiles: true, followSymlinks: false })) {
      if (filePath.includes(`${path.sep}node_modules${path.sep}`) || filePath.includes("/node_modules/")) continue;
      if (seen.has(filePath)) continue;
      seen.add(filePath);
      console.log(`Processing '${filePath}'....`);
      parseJunitReport(fs.readFileSync(filePath, "utf8"), result);
    }
  }

  console.log("\n\n");

  if (result.failed.length > 0) {
    console.log(renderJunitFailureReport(result.failed));
    console.error(
      `❌ There are ${result.failed.length} test failures. ${result.passed.length} tests succedded, though :)`
    );
    return 1;
  }
  console.log(`✅ All ${result.passed.length} tests passed!`);
  console.log("Done.");
  return 0;
}

// ---------- helpers ----------

function fail(msg: string): number {
  console.error(msg);
  return 2;
}

function emitOutputs(outputs: Record<string, string>): void {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  for (const [k, v] of Object.entries(outputs)) {
    const line = v.includes("\n") ? `${k}<<__EOF__\n${v}\n__EOF__\n` : `${k}=${v}\n`;
    fs.appendFileSync(out, line);
  }
}

function stdoutArray(s: string): string[] {
  return s
    .trim()
    .split(/\s/)
    .filter((x) => x.length > 0);
}

function toRepoRel(target: string, repoRoot: string): string {
  const isAbs = target.startsWith(path.sep) || target.startsWith(path.posix.sep);
  return `${isAbs ? path.relative(repoRoot, target) : target}`.split(path.sep).join(path.posix.sep);
}
