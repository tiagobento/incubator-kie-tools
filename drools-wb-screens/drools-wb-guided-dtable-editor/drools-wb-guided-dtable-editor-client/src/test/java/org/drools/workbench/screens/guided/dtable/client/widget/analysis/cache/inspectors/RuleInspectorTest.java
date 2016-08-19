/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.drools.workbench.screens.guided.dtable.client.widget.analysis.cache.inspectors;

import org.drools.workbench.screens.guided.dtable.client.widget.analysis.cache.RuleInspectorCache;
import org.drools.workbench.screens.guided.dtable.client.widget.analysis.checks.base.CheckManager;
import org.drools.workbench.screens.guided.dtable.client.widget.analysis.index.Rule;
import org.junit.Before;

import static org.mockito.Mockito.*;

public class RuleInspectorTest {

    @Before
    public void setUp() throws Exception {
        new RuleInspector( mock( Rule.class ),
                           new CheckManager(),
                           mock( RuleInspectorCache.class ) );
    }


}