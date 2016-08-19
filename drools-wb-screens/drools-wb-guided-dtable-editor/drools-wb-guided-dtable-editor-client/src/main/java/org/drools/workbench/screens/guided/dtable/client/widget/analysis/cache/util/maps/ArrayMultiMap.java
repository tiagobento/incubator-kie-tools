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

package org.drools.workbench.screens.guided.dtable.client.widget.analysis.cache.util.maps;

import java.util.ArrayList;
import java.util.SortedMap;

class ArrayMultiMap<Key extends Comparable, Value>
        extends RawMultiMap<Key, Value, ArrayList<Value>>
        implements MultiMap<Key, Value, ArrayList<Value>> {

    public ArrayMultiMap() {
        super( () -> new ArrayList<>() );
    }

    protected ArrayMultiMap( final SortedMap<Key, ArrayList<Value>> map ) {
        super( map,
               () -> new ArrayList<>() );
    }


    @Override
    public void addChangeListener( final MultiMapChangeHandler<Key, Value> multiMapChangeHandler ) {
        throw new UnsupportedOperationException( "This map " + this.getClass().getName() + " can not have change handlers." );
    }

    @Override
    public ArrayMultiMap<Key, Value> subMap( final Key fromKey,
                                             final boolean fromInclusive,
                                             final Key toKey,
                                             final boolean toInclusive ) {
        return new ArrayMultiMap<>( map.subMap( fromKey,
                                                fromInclusive,
                                                toKey,
                                                toInclusive ) );
    }
}
