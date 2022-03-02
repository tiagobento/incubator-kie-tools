/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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

import { ServerlessWorkflowChannelApi } from "./ServerlessWorkflowChannelApi";
import { Function, Service } from "@kie-tools/service-catalog/dist/api";
import { KogitoEditorEnvelopeContextType } from "@kie-tools-core/editor/dist/api";
import { ServerlessWorkflowEditorServiceCatalogApi } from "../api";

export class ServerlessWorkflowEditorServiceCatalogApiImpl implements ServerlessWorkflowEditorServiceCatalogApi {
  private services: Service[] = [];

  constructor(private readonly envelopeContext: KogitoEditorEnvelopeContextType<ServerlessWorkflowChannelApi>) {
    this.envelopeContext.channelApi.shared.kogitoServiceCatalog_getServices.subscribe((services) =>
      this.setServices(services)
    );
  }

  private setServices(services: Service[]): void {
    this.services = services;
  }

  public getFunctionByOperation(operationId: string): Function | undefined {
    if (operationId) {
      for (const service of this.services) {
        for (const func of service.functions) {
          if (func.operation === operationId) {
            return func;
          }
        }
      }
    }
    return undefined;
  }

  public getFunctions(serviceId?: string): Function[] {
    const result: Function[] = [];

    this.services.forEach((service) => {
      if (!serviceId || (serviceId && service.id === serviceId)) {
        result.push(...service.functions);
      }
    });
    return result;
  }

  public getServices(): Service[] {
    return this.services;
  }
}
