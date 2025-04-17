/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";
import { MessageSelector } from "../messageSelector/MessageSelector";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { ErrorSelector } from "../errorSelector/ErrorSelector";
import { EscalationCodeSelector } from "../escalationCodeSelector/EscalationCodeSelector";
import { SignalSelector } from "../signalSelector/SignalSelector";
import { TimerOptions } from "../timerOptions/TimerOptions";
import { ActivitySelector } from "../activitySelector/ActivitySelector";
import { SignalScopeSelector } from "../signalScopeSelector/SignalScopeSelector";
import { ConditionalEventSelector } from "../conditionalExpression/ConditionalExpressionSelector";
import { LinkSelector } from "../linkSelector/LinkSelector";

export type Event = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "startEvent" | "intermediateCatchEvent" | "intermediateThrowEvent" | "endEvent" | "boundaryEvent"
  >
>;

export function EventDefinitionProperties({ event }: { event: Event }) {
  const eventDefinition = event.eventDefinition?.[0];

  return (
    <>
      {(event.__$$element === "startEvent" ||
        event.__$$element === "intermediateCatchEvent" ||
        event.__$$element === "boundaryEvent") &&
        eventDefinition?.__$$element !== "linkEventDefinition" && <SlaDueDateInput element={event} />}

      {/* specifics */}
      <>
        {/* start and end */}
        {eventDefinition === undefined && ( //
          <>{/* nothing */}</>
        )}

        {/* all */}
        {eventDefinition?.__$$element === "messageEventDefinition" && ( //
          <>
            <MessageSelector element={event} />
          </>
        )}

        {/* all */}
        {eventDefinition?.__$$element === "signalEventDefinition" && ( //
          <>
            <SignalSelector element={event} />
            {(event.__$$element === "intermediateThrowEvent" || event.__$$element === "endEvent") && (
              <SignalScopeSelector element={event} />
            )}
          </>
        )}

        {eventDefinition?.__$$element === "linkEventDefinition" &&
          (event.__$$element === "intermediateCatchEvent" || //
            event.__$$element === "intermediateThrowEvent") && ( //
            <LinkSelector element={event} />
          )}

        {eventDefinition?.__$$element === "errorEventDefinition" && //
          (event.__$$element === "startEvent" ||
            event.__$$element === "intermediateCatchEvent" ||
            event.__$$element === "endEvent" ||
            event.__$$element === "boundaryEvent") && ( //
            <ErrorSelector element={event} />
          )}

        {/* all */}
        {eventDefinition?.__$$element === "escalationEventDefinition" && <EscalationCodeSelector element={event} />}

        {/* all */}
        {eventDefinition?.__$$element === "compensateEventDefinition" &&
          (event.__$$element === "intermediateThrowEvent" || event.__$$element === "endEvent") && ( //
            <ActivitySelector element={event} />
          )}

        {eventDefinition?.__$$element === "conditionalEventDefinition" &&
          (event.__$$element === "startEvent" ||
            event.__$$element === "intermediateCatchEvent" ||
            event.__$$element === "boundaryEvent") && ( //
            <ConditionalEventSelector element={event} />
          )}

        {eventDefinition?.__$$element === "timerEventDefinition" &&
          (event.__$$element === "startEvent" ||
            event.__$$element === "intermediateCatchEvent" ||
            event.__$$element === "boundaryEvent") && ( //
            <TimerOptions element={event} />
          )}

        {eventDefinition?.__$$element === "terminateEventDefinition" && //
          event.__$$element === "endEvent" && ( //
            <>{/* nothing */}</>
          )}

        {/* unsupported */}
        {(eventDefinition?.__$$element as any) === "multiple" && <>{/* nothing */}</>}
        {(eventDefinition?.__$$element as any) === "parallel multiple" && <>{/* nothing */}</>}
      </>
    </>
  );
}
