import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as child_process from "child_process";
import { getMarshaller } from "@kie-tools/dmn-marshaller";

const files = [
  "../tests-data--manual/attachment.dmn",
  "../tests-data--manual/empty13.dmn",
  "../tests-data--manual/sample12.dmn",
  "../tests-data--manual/weird.dmn",
];

const tmpDir = path.join(os.tmpdir(), "dmn-marshaller-type-safety-tests");

describe("type safety", () => {
  beforeAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`[dmn-marshaller] Type safety tests running on '${tmpDir}'.`);
  });

  afterAll(() => {
    // fs.rmdirSync(tmpDir, { recursive: true });
  });

  for (const file of files) {
    test(path.basename(file), () => {
      const xml = fs.readFileSync(path.join(__dirname, file), "utf-8");
      const { parser, instanceNs, version } = getMarshaller(xml);

      const { json } = parser.parse({ xml, instanceNs });

      const thisPath = path.resolve(__dirname);

      const minorVersion = version.split(".")[1];
      const tmpFile = `
import { DMN1${minorVersion}__tDefinitions } from "${thisPath}/../dist/schemas/dmn-1_${minorVersion}/ts-gen/types";
import "${thisPath}/../dist/kie-extensions";

const dmn: DMN1${minorVersion}__tDefinitions = ${JSON.stringify(json.definitions, undefined, 2)};`;

      const tmpFilePath = path.join(tmpDir, `${path.basename(file)}.ts`);
      fs.writeFileSync(tmpFilePath, tmpFile);

      const tsc = child_process.spawnSync("tsc", ["--noEmit", "--strict", tmpFilePath], { stdio: "pipe" });
      const tscOutput = tsc.output
        .map((line) => line?.toString())
        .join("\n")
        .trim();

      expect(tscOutput).toStrictEqual("");
    });
  }
});
