import * as fs from "fs";
import * as path from "path";
import { getMarshaller } from "@kie-tools/dmn-marshaller";

const files = ["../tests-data--manual/simple.scesim"];

describe("idempotency", () => {
  for (const file of files) {
    test(path.basename(file), () => {
      const xml_original = fs.readFileSync(path.join(__dirname, file), "utf-8");

      const { parser, instanceNs } = getMarshaller(xml_original);
      const { json } = parser.parse({ xml: xml_original, instanceNs });

      const xml_firstPass = parser.build({ json, instanceNs });
      const xml_secondPass = parser.build({ json: parser.parse({ xml: xml_firstPass, instanceNs }).json, instanceNs });

      expect(xml_firstPass).toStrictEqual(xml_secondPass);
    });
  }
});
