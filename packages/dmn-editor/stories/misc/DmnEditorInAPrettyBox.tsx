import * as React from "react";
import { DmnLatestModel } from "@kie-tools/dmn-marshaller";
import { DmnEditor } from "../../src/DmnEditor";

export function DmnEditorInAPrettyBox({ model }: { model: DmnLatestModel }) {
  return (
    <div
      style={{
        width: "100%",
        height: "840px",
        padding: "12px",
        paddingBottom: "60px",
        zoom: 0.75,
        margin: "60px 12px",
        boxShadow: "0 0 50px 20px lightgray",
        borderRadius: "24px",
        border: "1px solid gray",
      }}
    >
      <DmnEditor isReadOnly={true} model={model} />
    </div>
  );
}
