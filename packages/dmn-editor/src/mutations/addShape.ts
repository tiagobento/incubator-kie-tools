import { DMN15__tDefinitions, DMNDI15__DMNShape } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { addOrGetDefaultDiagram } from "./addOrGetDefaultDiagram";
import { generateUuid } from "@kie-tools/boxed-expression-component/dist/api";
import { NodeType } from "../diagram/connections/graphStructure";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { getCentralizedDecisionServiceDividerLine } from "./updateDecisionServiceDividerLine";

export function addShape({
  definitions,
  nodeType,
  shape,
}: {
  definitions: DMN15__tDefinitions;
  nodeType: NodeType;
  shape: WithoutIdXmlAttributes<DMNDI15__DMNShape>;
}) {
  const { diagramElements } = addOrGetDefaultDiagram({ definitions });
  diagramElements.push({
    __$$element: "dmndi:DMNShape",
    "@_id": generateUuid(),
    ...(nodeType === NODE_TYPES.decisionService
      ? { "dmndi:DMNDecisionServiceDividerLine": getCentralizedDecisionServiceDividerLine(shape["dc:Bounds"]!) }
      : {}),
    ...shape,
  });
}

export type WithoutIdXmlAttributes<T> = { [K in keyof T]: K extends "@_id" ? never : WithoutIdXmlAttributes<T[K]> };