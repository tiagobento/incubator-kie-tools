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

import { ServiceCatalogChannelApi, Service } from "../api";
import { ServiceCatalogRegistry } from "./ServiceCatalogRegistry";
import { SharedValueProvider } from "@kie-tools-core/envelope-bus/dist/api";
import { EnvelopeServer } from "@kie-tools-core/envelope-bus/dist/channel";
import { KogitoEditorEnvelopeApi } from "@kie-tools-core/editor/dist/api";

export class ServiceCatalogChannelApiImpl implements ServiceCatalogChannelApi {
  constructor(
    private readonly envelopeServer: EnvelopeServer<ServiceCatalogChannelApi, KogitoEditorEnvelopeApi>,
    private readonly registry: ServiceCatalogRegistry
  ) {
    this.registry.init((services) => this.loadServices(services));
    this.registry.load();
  }

  private loadServices(services: Service[] = []) {
    this.envelopeServer.shared.kogitoServiceCatalog_getServices.set(services);
  }

  kogitoServiceCatalog_getServices(): SharedValueProvider<Service[]> {
    return {
      defaultValue: [],
    };
  }

  dispose(): void {
    this.registry.dispose();
  }
}
