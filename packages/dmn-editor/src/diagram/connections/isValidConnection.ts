import { Connection, Edge, Node } from "reactflow";
import { EdgeType, NodeType, graphStructure } from "./graphStructure";

export function checkIsValidConnection(nodesById: Map<string, Node>, edge: Edge | Connection) {
  if (!edge.source || !edge.target) {
    return false;
  }

  const sourceNode = nodesById.get(edge.source);
  const targetNode = nodesById.get(edge.target);

  return _checkIsValidConnection(sourceNode, targetNode, edge.sourceHandle);
}

export function _checkIsValidConnection(
  sourceNode: { type?: string } | undefined,
  targetNode: { type?: string } | undefined,
  edge: string | null | undefined
) {
  if (!sourceNode?.type || !targetNode?.type || !edge) {
    return false;
  }

  return (
    graphStructure
      .get(sourceNode.type as NodeType)
      ?.get(edge as EdgeType)
      ?.has(targetNode.type as NodeType) ?? false
  );
}
