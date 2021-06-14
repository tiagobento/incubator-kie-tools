#!/usr/bin/env node

/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const buildEnv = require("./index");
const graphviz = require("graphviz");
const { getPackagesSync } = require("@lerna/project");
const fs = require("fs");
const path = require("path");

async function main() {
  const opt = process.argv[2];

  if (opt === "--build-graph") {
    const g = graphviz.digraph("G");

    g.use = "dot";
    g.set("ranksep", "1.5");
    g.set("splines", "line");
    g.setNodeAttribut("shape", "box");

    const packages = getPackagesSync();
    const packageMap = new Map(packages.map((p) => [p.name, p]));
    const packageNames = new Set(packages.map((p) => p.name));

    const adjMatrix = {};
    for (const pkg of packages) {
      adjMatrix[pkg.name] = adjMatrix[pkg.name] ?? {};
      for (const depName of Object.keys(pkg.dependencies ?? {})) {
        if (packageNames.has(depName)) {
          adjMatrix[pkg.name][depName] = "dependency";
        }
      }
      for (const depName of Object.keys(pkg.devDependencies ?? {})) {
        if (packageNames.has(depName)) {
          adjMatrix[pkg.name][depName] = "devDependency";
        }
      }
    }

    // transitive reduction
    const trMatrix = JSON.parse(JSON.stringify(adjMatrix));
    for (const s in trMatrix)
      for (const u in trMatrix)
        if (trMatrix[u][s] === "dependency" || trMatrix[u][s] === "devDependency")
          for (const v in trMatrix)
            if (trMatrix[s][v] === "dependency" || trMatrix[s][v] === "devDependency") trMatrix[u][v] = "transitive";

    const resMatrix = trMatrix;

    // print graph
    for (const pkgName in resMatrix) {
      const displayPkgName = pkgName;

      const node = g.addNode(displayPkgName);
      if (packageMap.get(pkgName)?.private) {
        node.set("style", "dashed");
      } else {
        node.set("color", "blue");
        node.set("fontcolor", "blue");
      }

      for (const depName in resMatrix[pkgName]) {
        const displayDepName = depName;

        if (resMatrix[pkgName][depName] === "dependency") {
          const edge = g.addEdge(displayPkgName, displayDepName);
          edge.set("style", "solid");
        } else if (resMatrix[pkgName][depName] === "devDependency") {
          const edge = g.addEdge(displayPkgName, displayDepName);
          edge.set("style", "dashed");
        } else if (resMatrix[pkgName][depName] === "transitive") {
          // ignore
        }
      }
    }

    const data = g.to_dot();

    const outputFilePath = path.resolve(__dirname, "graph.dot");
    fs.writeFileSync(outputFilePath, data);

    console.info(`[build-env] Wrote dependency graph to '${outputFilePath}'`);
    process.exit(0);
  }

  if (opt === "--print-env") {
    const result = {};
    const vars = buildEnv.vars().ENV_VARS;

    for (const v in vars) {
      result[vars[v].name] = buildEnv.vars().getOrDefault(vars[v]);
      if (vars[v].default === undefined && result[vars[v].name]) {
        result[vars[v].name] += " <- CHANGED 👀️ ";
      } else if (result[vars[v].name] === undefined) {
        result[vars[v].name] = "[unset] Default value may vary ⚠️ ";
      } else if (result[vars[v].name] !== vars[v].default) {
        result[vars[v].name] += " <- CHANGED 👀️ ";
      }
    }

    console.log("[build-env] Environment variables:");
    console.log(JSON.stringify(flattenObj(result), undefined, 2));
    process.exit(0);
  }

  if (opt === "--print-vars") {
    const vars = buildEnv.vars().ENV_VARS;
    for (const key in vars) {
      console.log(vars[key].name);
    }
    process.exit(0);
  }

  if (opt === "--print-config") {
    console.log("[build-env] CLI-accessible config:");
    console.log(JSON.stringify(flattenObj(buildEnv), undefined, 2));
    process.exit(0);
  }

  const propertyPath = opt;
  if (!propertyPath) {
    console.error("Please an option.");
    process.exit(1);
  }

  let prop = buildEnv;
  for (const p of propertyPath.split(".")) {
    prop = prop[p];
    if (prop === undefined || typeof prop === "function") {
      console.error(`Property '${propertyPath}' not found.`);
      process.exit(1);
    }
  }

  console.log(prop);
}

function flattenObj(obj, parent, res = {}) {
  for (const key in obj) {
    let propName = parent ? parent + "." + key : key;
    if (typeof obj[key] == "object") {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

main();
