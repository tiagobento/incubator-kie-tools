import { DmnDataType } from "@kie-tools/boxed-expression-component/dist/api";
import { DMN15__tDefinitions, DMNDI15__DMNDiagram } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";

export interface DmnIndex {
  drgElements: Index<Required<DMN15__tDefinitions["drgElement"]>>;
  artifacts: Index<Required<DMN15__tDefinitions["artifact"]>>;
  diagramElements: Index<Required<DMNDI15__DMNDiagram["dmndi:DMNDiagramElement"]>>;
}

export function createDmnIndex(dmn: { definitions: DMN15__tDefinitions }): DmnIndex {
  return {
    drgElements: (dmn.definitions.drgElement ?? []).reduce<DmnIndex["drgElements"]>((acc, e, index) => {
      const m = acc.get(e.__$$element) ?? new Map<string, SubIndex<DmnIndex["drgElements"]>>();
      return e["@_id"] ? acc.set(e.__$$element, m.set(e["@_id"], { ...e, index })) : acc;
    }, new Map()),
    //
    artifacts: (dmn.definitions.artifact ?? []).reduce<DmnIndex["artifacts"]>((acc, e, index) => {
      const m = acc.get(e.__$$element) ?? new Map<string, SubIndex<DmnIndex["artifacts"]>>();
      return e["@_id"] ? acc.set(e.__$$element, m.set(e["@_id"], { ...e, index })) : acc;
    }, new Map()),
    //
    diagramElements: (
      dmn.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"]?.[0]?.["dmndi:DMNDiagramElement"] ?? []
    ).reduce<DmnIndex["diagramElements"]>((acc, e, index) => {
      const m = acc.get(e.__$$element) ?? new Map<string, SubIndex<DmnIndex["drgElements"]>>();
      return e["@_id"] ? acc.set(e.__$$element, m.set(e["@_id"], { ...e, index })) : acc;
    }, new Map()),
  };
}

type Unpacked<T> = T extends Array<infer U> ? U : never;
type Required<T> = T extends undefined ? never : T;

type Index<T extends { __$$element: string }[]> = Map<
  Unpacked<T>["__$$element"],
  Map<string, Unpacked<T> & { index: number }>
>;
type SubIndex<T> = T extends Index<infer U> ? (U extends Map<string, infer X> ? X : never) : never;
