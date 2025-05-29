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

import "../../tsDmnModule";
import LoanPreQualificationDmnRaw from "!!raw-loader!./Loan Pre-Qualification.dmn";
import SumDiffDsDmnRaw from "!!raw-loader!./SumDiffDs.dmn";
import SumBkmDmnRaw from "!!raw-loader!./SumBkm.dmn";
import AutolayoutDmnRaw from "!!raw-loader!./Autolayout.dmn";

import { getMarshaller } from "@kie-tools/dmn-marshaller";

export const USE_CASE_MODELS = {
  loanPreQualification: {
    model: getMarshaller(LoanPreQualificationDmnRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: LoanPreQualificationDmnRaw,
    filename: "Loan Pre-Qualification.dmn",
  },
  sumDiffDs: {
    model: getMarshaller(SumDiffDsDmnRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: SumDiffDsDmnRaw,
    filename: "SumDiffDs.dmn",
  },
  sumBkm: {
    model: getMarshaller(SumBkmDmnRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: SumBkmDmnRaw,
    filename: "SumBkm.dmn",
  },
  autolayout: {
    model: getMarshaller(AutolayoutDmnRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: AutolayoutDmnRaw,
    filename: "Autolayout.dmn",
  },
};
