/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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

const graphviz = require("graphviz");
const DataVisTechGraph = require("graph-data-structure");
const fs = require("fs");
const path = require("path");

const targetDir = process.argv[2];

function main() {
  if (!targetDir) {
    console.error("Please specify the directory path where the graph files will be written to.");
    process.exit(1);
  }

  const dotGraphFilePath = path.join(targetDir, "graph.dot");
  const datavisGraphFilePath = path.join(targetDir, "graph.json");
  console.info(`[generate-packages-graph] Writing packages DOT graph to '${dotGraphFilePath}'...`);

  const packages = getPackagesSync();
  const packageMap = new Map(packages.map((p) => [p.name, p]));
  const packageNames = new Set(packages.map((p) => p.name));

  const adjMatrix = {};
  for (const pkg of packages) {
    adjMatrix[pkg.name] = adjMatrix[pkg.name] ?? {};
    const dependencies = Object.keys(pkg.dependencies ?? {}).sort();
    for (const depName of dependencies) {
      if (packageNames.has(depName)) {
        adjMatrix[pkg.name][depName] = "dependency";
      }
    }
    const devDependencies = Object.keys(pkg.devDependencies ?? {}).sort();
    for (const depName of devDependencies) {
      if (packageNames.has(depName)) {
        adjMatrix[pkg.name][depName] = "devDependency";
      }
    }
  }

  // transitive reduction
  const trMatrix = JSON.parse(JSON.stringify(adjMatrix));
  for (const s in trMatrix)
    for (const u in trMatrix)
      if (trMatrix[u][s] === "dependency" || trMatrix[u][s] === "devDependency" || trMatrix[u][s] === "transitive")
        for (const v in trMatrix)
          if (
            trMatrix[s][v] === "dependency" ||
            trMatrix[s][v] === "devDependency" ||
            trMatrix[s][v] === "transitive"
          ) {
            trMatrix[u][v] = "transitive";
          }

  const resMatrix = trMatrix;

  // print DOT graph
  const g = graphviz.digraph("G");

  g.use = "dot";
  g.set("ranksep", "2");
  g.set("splines", "polyline");
  g.set("rankdir", "TB");
  g.set("ordering", "out");

  g.setNodeAttribut("shape", "box");

  g.setEdgeAttribut("headport", "n");
  g.setEdgeAttribut("tailport", "s");
  g.setEdgeAttribut("arrowhead", "dot");
  g.setEdgeAttribut("arrowsize", "0.5");

  const root = g.addNode("kiegroup/kie-tools");
  root.set("shape", "folder");

  for (const pkgName in resMatrix) {
    const displayPkgName = pkgName;

    const pkgProperties = (() => {
      if (pkgName.startsWith("@kie-tools-examples") || pkgName.startsWith("kie-tools-examples-")) {
        return { color: "orange", nodeStyle: "dashed, rounded" };
      } else if (packageMap.get(pkgName)?.private) {
        return { color: "black", nodeStyle: "dashed, rounded" };
      } else if (pkgName.startsWith("@kie-tools-core")) {
        return { color: "purple", nodeStyle: "rounded" };
      } else {
        return { color: "blue", nodeStyle: "rounded" };
      }
    })();

    const node = g.addNode(displayPkgName);
    node.set("color", pkgProperties.color);
    node.set("fontcolor", pkgProperties.color);
    node.set("style", pkgProperties.nodeStyle);

    if (Object.keys(resMatrix[pkgName]).length === 0) {
      g.addEdge(displayPkgName, root, {});
    }

    for (const depName in resMatrix[pkgName]) {
      const displayDepName = depName;
      if (resMatrix[pkgName][depName] === "dependency") {
        const edge = g.addEdge(displayPkgName, displayDepName, {});
        edge.set("style", "solid");
        edge.set("color", pkgProperties.color);
      } else if (resMatrix[pkgName][depName] === "devDependency") {
        const edge = g.addEdge(displayPkgName, displayDepName, {});
        edge.set("style", "dashed");
        edge.set("color", pkgProperties.color);
      } else if (resMatrix[pkgName][depName] === "transitive") {
        // ignore
      }
    }
  }

  if (!fs.existsSync(path.resolve(targetDir))) {
    fs.mkdirSync(path.resolve(targetDir));
  }

  fs.writeFileSync(datavisGraphFilePath, g.to_dot());
  console.info(`[generate-packages-graph] Wrote packages DOT graph to '${dotGraphFilePath}'`);

  console.info(`[generate-packages-graph] Writing packages Datavis graph to '${datavisGraphFilePath}'...`);
  const relativize = (pkgLocation) => path.relative(path.resolve("."), pkgLocation);
  const datavisGraph = DataVisTechGraph();
  for (const pkgName in resMatrix) {
    const pkg = packageMap.get(pkgName);
    const pkgNode = pkg.name;
    datavisGraph.addNode(pkgNode);

    for (const depName in resMatrix[pkgName]) {
      if (resMatrix[pkgName][depName] === "transitive") {
        continue;
      }

      const dep = packageMap.get(depName);
      const depNode = dep.name;
      datavisGraph.addEdge(pkgNode, depNode);
    }
  }

  const serializedDatavisGraph = datavisGraph.serialize();
  const serializedPackages = Array.from(packageMap.entries()).map(([k, v]) => [
    k,
    { name: k, location: relativize(v.location) },
  ]);
  fs.writeFileSync(datavisGraphFilePath, JSON.stringify({ serializedDatavisGraph, serializedPackages }, undefined, 2));
  console.info(`[generate-packages-graph] Wrote packages Datavis graph to '${datavisGraphFilePath}'`);

  console.info(`[generate-packages-graph] Done.`);
  process.exit(0);
}

main();
