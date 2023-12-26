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

import { WorkspaceEdit, ResourceContent, ResourceContentRequest, ResourceListRequest, ResourcesList } from "../api";

export interface WorkspaceChannelApi {
  kogitoWorkspace_newEdit(edit: WorkspaceEdit): void;
  kogitoWorkspace_openFile(pathRelativeToTheWorkspaceRoot: string): void;
  kogitoWorkspace_resourceContentRequest(request: ResourceContentRequest): Promise<ResourceContent | undefined>;
  kogitoWorkspace_resourceListRequest(request: ResourceListRequest): Promise<ResourcesList>;
}
