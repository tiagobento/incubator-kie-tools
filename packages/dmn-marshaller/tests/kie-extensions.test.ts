import * as fs from "fs";
import * as path from "path";
import { getMarshaller } from "@kie-tools/dmn-marshaller";

describe("kie-extensions", () => {
  test("kie:attachment", () => {
    const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/attachment.dmn"), "utf-8");
    const { parser, instanceNs } = getMarshaller(xml);
    const { json } = parser.parse({ xml, instanceNs });

    const attachments = (json.definitions["knowledgeSource"] ?? []).flatMap(
      (k) => k.extensionElements?.["kie:attachment"]
    );

    expect(attachments.length).toStrictEqual(1);
  });

  test("kie:ComponentWidthsExtension", () => {
    const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/sample12.dmn"), "utf-8");
    const { parser, instanceNs } = getMarshaller(xml);
    const { json } = parser.parse({ xml, instanceNs });

    const componentWidthsExtension = (json.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"] ?? []).flatMap(
      (d) => d["di:extension"]?.["kie:ComponentsWidthsExtension"] ?? []
    );

    expect(componentWidthsExtension.length).toStrictEqual(1);
    expect(componentWidthsExtension.flatMap((s) => s["kie:ComponentWidths"] ?? []).length).toStrictEqual(24);
  });
});
