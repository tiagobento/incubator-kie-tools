import * as React from "react";
import { useCallback, useRef, useState } from "react";

import { DEFAULT_DEV_WEBAPP_DMN } from "./DefaultDmn";
import { DmnEditor, DmnEditorRef } from "../../src/DmnEditor";

import { Flex, FlexItem } from "@patternfly/react-core/dist/js/layouts/Flex";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";

export function DevWebApp() {
  const [xml, setXml] = useState(DEFAULT_DEV_WEBAPP_DMN);

  const onDrop = useCallback((e: React.DragEvent) => {
    console.log("File(s) dropped");

    e.preventDefault(); // Necessary to disable the browser's default 'onDrop' handling.

    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      [...e.dataTransfer.items].forEach((item, i) => {
        if (item.kind === "file") {
          const reader = new FileReader();
          reader.addEventListener("load", ({ target }) => setXml(target?.result as string));
          reader.readAsText(item.getAsFile() as any);
        }
      });
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // Necessary to disable the browser's default 'onDrop' handling.
  }, []);

  const ref = useRef<DmnEditorRef>(null);

  const copyAsXml = useCallback(() => {
    navigator.clipboard.writeText(ref.current?.getContent() || "");
  }, []);

  const downloadRef = useRef<HTMLAnchorElement>(null);
  const downloadAsXml = useCallback(() => {
    if (downloadRef.current) {
      const fileBlob = new Blob([ref.current?.getContent() || ""], { type: "text/xml" });
      downloadRef.current.download = `dmn-${makeid(10)}.dmn`;
      downloadRef.current.href = URL.createObjectURL(fileBlob);
      downloadRef.current.click();
    }
  }, []);

  return (
    <>
      <Page onDragOver={onDragOver} onDrop={onDrop}>
        <PageSection variant={"light"} isFilled={false} padding={{ default: "padding" }}>
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
            <FlexItem shrink={{ default: "shrink" }}>
              <h3>DMN Editor :: Dev webapp </h3>
            </FlexItem>
            <FlexItem>
              <h5>(Drag & drop a file anywhere to open it)</h5>
            </FlexItem>
            <FlexItem shrink={{ default: "shrink" }}>
              <button onClick={copyAsXml}>Copy as XML</button>
              &nbsp; &nbsp;
              <button onClick={downloadAsXml}>Download as XML</button>
            </FlexItem>
          </Flex>
          <a ref={downloadRef} />
        </PageSection>
        <hr />
        <PageSection variant={"light"} isFilled={true} hasOverflowScroll={true} padding={{ default: "noPadding" }}>
          <DmnEditor ref={ref} xml={xml} />
        </PageSection>
      </Page>
    </>
  );
}

function makeid(length: number) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
