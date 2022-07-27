/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * EXPOSED INTEROP API
 *
 * This API is exposed from the Envelope to be consumed on Java code.
 */
export interface ResourceContentExposedInteropApi {
  get(path: string): Promise<string | undefined>; // FIXME: tiago change this so that WID icons can work on standalone editors
  list(globPattern: string, opts?: { searchType: "traversal" | "asset-folder" }): Promise<string[]>;
}
