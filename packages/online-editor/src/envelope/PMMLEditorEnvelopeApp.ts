/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as EditorEnvelope from "@kogito-tooling/editor/dist/envelope";
import { PMMLEditorFactory } from "@kogito-tooling/pmml-editor";
import { EnvelopeBusMessage } from "@kogito-tooling/envelope-bus/dist/api";

EditorEnvelope.init({
  container: document.getElementById("envelope-app")!,
  bus: {
    postMessage<D, Type>(message: EnvelopeBusMessage<D, Type>, targetOrigin?: string, _?: any) {
      window.parent.postMessage(message, "*", _);
    }
  },
  editorFactory: new PMMLEditorFactory()
});
