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

import { describe, test, expect } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import {
  checkOptimalPartialBuild,
  computeAllLeafPackages,
  decidePartitionModes,
  parseJunitReport,
  parsePatternFile,
  prefixWithRoots,
  renderBuildSummary,
  toExactFilter,
  toFindPathArgs,
  toGitDiffExcludePathspec,
  toTransitiveDepsFilter,
  validatePartitionDefinitions,
  type JunitParseResult,
  type PartitionDefinition,
  type SummaryInput,
} from "../src/core";

// ---------- patterns ----------

describe("parsePatternFile", () => {
  test("strips empty lines and trims whitespace", () => {
    expect(parsePatternFile("  foo  \n\nbar\n  ")).toEqual(["foo", "bar"]);
  });

  test("treats a file of just whitespace as empty", () => {
    expect(parsePatternFile("\n\n  \n")).toEqual([]);
  });

  test("preserves the original order", () => {
    expect(parsePatternFile("z\na\nm\n")).toEqual(["z", "a", "m"]);
  });
});

describe("prefixWithRoots", () => {
  test("cross-products every pattern with every root, patterns-outer", () => {
    expect(prefixWithRoots(["**/a", "**/b"], ["packages", "examples"])).toEqual([
      "packages/**/a",
      "examples/**/a",
      "packages/**/b",
      "examples/**/b",
    ]);
  });

  test("returns empty when there are no patterns", () => {
    expect(prefixWithRoots([], ["packages"])).toEqual([]);
  });

  test("returns empty when there are no roots", () => {
    expect(prefixWithRoots(["**/a"], [])).toEqual([]);
  });
});

describe("toGitDiffExcludePathspec", () => {
  test("wraps each pattern in a ':!pattern' pathspec joined by spaces", () => {
    expect(toGitDiffExcludePathspec(["docs", "*.svg"])).toBe("':!docs' ':!*.svg'");
  });

  test("empty input yields empty string", () => {
    expect(toGitDiffExcludePathspec([])).toBe("");
  });
});

describe("toFindPathArgs", () => {
  test("joins patterns with ` -o ` for use with `find`", () => {
    expect(toFindPathArgs(["**/x", "**/y"])).toBe("-path '**/x' -o -path '**/y'");
  });

  test("a single pattern produces a single -path arg with no separator", () => {
    expect(toFindPathArgs(["**/x"])).toBe("-path '**/x'");
  });

  test("empty input yields empty string", () => {
    expect(toFindPathArgs([])).toBe("");
  });
});

// ---------- partitioning ----------

describe("computeAllLeafPackages", () => {
  // Links here are source -> target, meaning "source depends on target"
  // (matches how `generate_packages_graph.js` emits them).
  // A "leaf" is therefore a package that NOTHING depends on — a top-level app.

  test("leaves = packages not appearing as any link target, minus the root", () => {
    const result = computeAllLeafPackages({
      packageNames: ["root", "app", "lib", "util"],
      dependencyLinks: [
        { source: "app", target: "lib" },
        { source: "app", target: "util" },
        { source: "lib", target: "util" },
      ],
      rootPackageName: "root",
    });
    expect(result).toEqual(new Set(["app"]));
  });

  test("multiple top-level apps all come out as leaves", () => {
    const result = computeAllLeafPackages({
      packageNames: ["root", "app-a", "app-b", "shared"],
      dependencyLinks: [
        { source: "app-a", target: "shared" },
        { source: "app-b", target: "shared" },
      ],
      rootPackageName: "root",
    });
    expect(result).toEqual(new Set(["app-a", "app-b"]));
  });

  test("root is excluded even if nothing else depends on it", () => {
    const result = computeAllLeafPackages({
      packageNames: ["root"],
      dependencyLinks: [],
      rootPackageName: "root",
    });
    expect(result).toEqual(new Set());
  });
});

describe("validatePartitionDefinitions", () => {
  const allLeafPackages = new Set(["app-a", "app-b", "app-c"]);
  const allPackageDirs = new Set(["packages/app-a", "packages/app-b", "packages/app-c", "packages/util"]);

  test("reports nothing when partitions are well-formed and complete", () => {
    const partitions: PartitionDefinition[] = [
      {
        name: "p0",
        leafPackageNames: new Set(["app-a"]),
        dirs: new Set(["packages/app-a", "packages/util"]),
      },
      {
        name: "p1",
        leafPackageNames: new Set(["app-b", "app-c"]),
        dirs: new Set(["packages/app-b", "packages/app-c", "packages/util"]),
      },
    ];
    expect(validatePartitionDefinitions({ allLeafPackages, partitions, allPackageDirs })).toEqual([]);
  });

  test("flags non-leaf packages declared in partitions", () => {
    const partitions: PartitionDefinition[] = [
      {
        name: "p0",
        leafPackageNames: new Set(["app-a", "util"]),
        dirs: new Set(allPackageDirs),
      },
    ];
    const issues = validatePartitionDefinitions({ allLeafPackages, partitions, allPackageDirs });
    expect(issues).toEqual([{ kind: "non-leaf-packages-in-partitions", packages: ["util"] }]);
  });

  test("flags a leaf package declared in two partitions as an overlap", () => {
    const partitions: PartitionDefinition[] = [
      { name: "p0", leafPackageNames: new Set(["app-a"]), dirs: new Set(allPackageDirs) },
      { name: "p1", leafPackageNames: new Set(["app-a", "app-b", "app-c"]), dirs: new Set(allPackageDirs) },
    ];
    const issues = validatePartitionDefinitions({ allLeafPackages, partitions, allPackageDirs });
    expect(issues).toEqual([{ kind: "overlapping-partitions", duplicates: ["app-a"] }]);
  });

  test("flags dirs that no partition covers", () => {
    const partitions: PartitionDefinition[] = [
      {
        name: "p0",
        leafPackageNames: new Set(["app-a"]),
        dirs: new Set(["packages/app-a"]),
      },
    ];
    const issues = validatePartitionDefinitions({ allLeafPackages, partitions, allPackageDirs });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ kind: "incomplete-partitions" });
  });
});

describe("checkOptimalPartialBuild", () => {
  test("returns null when upstream + affected = relevant (disjoint, covering)", () => {
    expect(
      checkOptimalPartialBuild({
        partitionName: "p0",
        upstreamPackageNames: new Set(["util"]),
        affectedPackageNames: new Set(["app-a"]),
        relevantPackageNames: new Set(["util", "app-a"]),
      })
    ).toBeNull();
  });

  test("flags a mismatch (e.g. overlap, or missing relevant packages)", () => {
    expect(
      checkOptimalPartialBuild({
        partitionName: "p0",
        upstreamPackageNames: new Set(["util", "app-a"]),
        affectedPackageNames: new Set(["app-a"]),
        relevantPackageNames: new Set(["util", "app-a"]),
      })
    ).toEqual({ kind: "non-optimal-partial-build", partition: "p0" });
  });
});

describe("decidePartitionModes", () => {
  const packageNamesByDir = new Map([
    ["packages/util", "util"],
    ["packages/app-a", "app-a"],
    ["packages/app-b", "app-b"],
  ]);

  const partitions: PartitionDefinition[] = [
    {
      name: "p0",
      leafPackageNames: new Set(["app-a"]),
      dirs: new Set(["packages/app-a", "packages/util"]),
    },
    {
      name: "p1",
      leafPackageNames: new Set(["app-b"]),
      dirs: new Set(["packages/app-b", "packages/util"]),
    },
  ];

  test("forceFull=true gives every partition 'full' mode with transitive filter strings", () => {
    const result = decidePartitionModes({
      forceFull: true,
      partitions,
      packageNamesByDir,
      changedSourcePathsInRoot: [],
      changedPackageDirs: [],
      affectedPackageDirsInAllPartitions: [],
      relevantPackageNamesByPartition: new Map(),
    });
    expect(result).toEqual([
      {
        mode: "full",
        name: "p0",
        bootstrapPnpmFilterString: "-F 'app-a...'",
        fullBuildPnpmFilterString: "-F 'app-a...'",
      },
      {
        mode: "full",
        name: "p1",
        bootstrapPnpmFilterString: "-F 'app-b...'",
        fullBuildPnpmFilterString: "-F 'app-b...'",
      },
    ]);
  });

  test("any changed file outside package-root paths forces 'full' for every partition", () => {
    const result = decidePartitionModes({
      forceFull: false,
      partitions,
      packageNamesByDir,
      changedSourcePathsInRoot: ["pnpm-workspace.yaml"],
      changedPackageDirs: [],
      affectedPackageDirsInAllPartitions: [],
      relevantPackageNamesByPartition: new Map(),
    });
    expect(result.every((p) => p.mode === "full")).toBe(true);
  });

  test("partition with no changed packages gets mode 'none'", () => {
    const result = decidePartitionModes({
      forceFull: false,
      partitions,
      packageNamesByDir,
      changedSourcePathsInRoot: [],
      changedPackageDirs: ["packages/app-a"],
      affectedPackageDirsInAllPartitions: ["packages/app-a"],
      relevantPackageNamesByPartition: new Map([["p0", new Set(["app-a"])]]),
    });
    expect(result[0]).toMatchObject({ mode: "partial", name: "p0" });
    expect(result[1]).toEqual({ mode: "none", name: "p1" });
  });

  test("partial build splits into upstream + affected and builds filter strings", () => {
    const result = decidePartitionModes({
      forceFull: false,
      partitions,
      packageNamesByDir,
      changedSourcePathsInRoot: [],
      changedPackageDirs: ["packages/app-a"],
      affectedPackageDirsInAllPartitions: ["packages/app-a"],
      relevantPackageNamesByPartition: new Map([
        ["p0", new Set(["util", "app-a"])],
        ["p1", new Set()],
      ]),
    });
    expect(result[0]).toEqual({
      mode: "partial",
      name: "p0",
      bootstrapPnpmFilterString: "-F 'util' -F 'app-a'",
      upstreamPnpmFilterString: "-F 'util'",
      affectedPnpmFilterString: "-F 'app-a'",
    });
    expect(result[1]).toEqual({ mode: "none", name: "p1" });
  });

  test("a dir that's affected but doesn't fall inside any partition's dirs is ignored for that partition", () => {
    const result = decidePartitionModes({
      forceFull: false,
      partitions,
      packageNamesByDir,
      changedSourcePathsInRoot: [],
      changedPackageDirs: ["packages/app-a"],
      affectedPackageDirsInAllPartitions: ["packages/app-a", "packages/app-b"],
      relevantPackageNamesByPartition: new Map([["p0", new Set(["util", "app-a"])]]),
    });
    expect(result[0]).toMatchObject({
      affectedPnpmFilterString: "-F 'app-a'",
    });
  });
});

describe("filter string builders", () => {
  test("toExactFilter wraps each name in -F '...' joined by spaces", () => {
    expect(toExactFilter(["a", "b"])).toBe("-F 'a' -F 'b'");
  });

  test("toTransitiveDepsFilter appends `...` to each name", () => {
    expect(toTransitiveDepsFilter(["a", "b"])).toBe("-F 'a...' -F 'b...'");
  });

  test("empty input produces empty string", () => {
    expect(toExactFilter([])).toBe("");
    expect(toTransitiveDepsFilter([])).toBe("");
  });
});

// ---------- summary ----------

const baseInput: SummaryInput = {
  os: "Linux",
  partitionIndex: 0,
  partitionDecision: { mode: "none", name: "p0" },
  triggeredBy: "pull-request",
  baseSha: "abcdef1234567",
  headSha: "9876543210fedc",
  changedSourcePathsInRoot: [],
  changedPackageNames: [],
};

describe("renderBuildSummary — mode: none", () => {
  test("explicitly states nothing ran and why", () => {
    const out = renderBuildSummary(baseInput);
    expect(out).toContain("Mode:** `none`");
    expect(out).toContain("no changes affect packages in this partition");
    expect(out).toContain("_Nothing_");
  });

  test("does not offer a reproduction recipe when there is nothing to reproduce", () => {
    const out = renderBuildSummary(baseInput);
    expect(out).not.toContain("pnpm bootstrap -F");
    expect(out).toContain("Nothing to reproduce");
  });
});

describe("renderBuildSummary — mode: full", () => {
  const full: SummaryInput = {
    ...baseInput,
    partitionDecision: {
      mode: "full",
      name: "p0",
      bootstrapPnpmFilterString: "-F 'app-a...'",
      fullBuildPnpmFilterString: "-F 'app-a...'",
    },
    changedSourcePathsInRoot: ["pnpm-workspace.yaml"],
  };

  test("cites the root-level change as the reason for full mode", () => {
    const out = renderBuildSummary(full);
    expect(out).toContain("changes outside package roots were detected");
  });

  test("emits the full-build reproduction steps", () => {
    const out = renderBuildSummary(full);
    expect(out).toContain("pnpm bootstrap -F 'app-a...'");
    expect(out).toContain(`eval "pnpm -F 'app-a...' --workspace-concurrency=1 build:prod"`);
  });
});

describe("renderBuildSummary — mode: partial", () => {
  const partial: SummaryInput = {
    ...baseInput,
    partitionDecision: {
      mode: "partial",
      name: "p0",
      bootstrapPnpmFilterString: "-F 'util' -F 'app-a'",
      upstreamPnpmFilterString: "-F 'util'",
      affectedPnpmFilterString: "-F 'app-a'",
    },
    changedPackageNames: ["app-a"],
  };

  test("shows both the upstream dev build and the affected prod build in the recipe", () => {
    const out = renderBuildSummary(partial);
    expect(out).toContain(`eval "pnpm -F 'util' --if-present build:dev"`);
    expect(out).toContain(`eval "pnpm -F 'app-a' --if-present --workspace-concurrency=1 build:prod"`);
  });

  test("lists the changed package", () => {
    const out = renderBuildSummary(partial);
    expect(out).toContain("- `app-a`");
  });
});

describe("renderBuildSummary — changed files truncation", () => {
  test("truncates long lists and reports the remaining count", () => {
    const out = renderBuildSummary({
      ...baseInput,
      partitionDecision: {
        mode: "partial",
        name: "p0",
        bootstrapPnpmFilterString: "",
        upstreamPnpmFilterString: "",
        affectedPnpmFilterString: "",
      },
      changedPackageNames: Array.from({ length: 25 }, (_, i) => `pkg-${i}`),
    });
    expect(out).toContain("- `pkg-0`");
    expect(out).toContain("- `pkg-19`");
    expect(out).not.toContain("- `pkg-20`");
    expect(out).toContain("_...and 5 more_");
  });
});

// ---------- junit ----------

function parseFixture(name: string): JunitParseResult {
  const result: JunitParseResult = { failed: [], passed: [] };
  const xml = fs.readFileSync(path.join(__dirname, "reports", name), "utf8");
  parseJunitReport(xml, result);
  return result;
}

describe("parseJunitReport", () => {
  test("empty", () => {
    const { failed, passed } = parseFixture("empty.xml");
    expect(failed.length).toBe(0);
    expect(passed.length).toBe(0);
  });

  test("cypress", () => {
    const { failed, passed } = parseFixture("junit-report__from-cypress.xml");
    expect(failed.length).toBe(0);
    expect(passed.length).toBe(6);
  });

  test("jest", () => {
    const { failed, passed } = parseFixture("junit-report__from-jest.xml");
    expect(failed.length).toBe(0);
    expect(passed.length).toBe(33);
  });

  test("surefire", () => {
    const { failed, passed } = parseFixture("junit-report__from-surefire.xml");
    expect(failed.length).toBe(0);
    expect(passed.length).toBe(1);
  });
});
