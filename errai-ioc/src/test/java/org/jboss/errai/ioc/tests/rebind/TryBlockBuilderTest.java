/*
 * Copyright 2011 JBoss, a divison Red Hat, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.jboss.errai.ioc.tests.rebind;

import org.jboss.errai.ioc.rebind.ioc.codegen.Variable;
import org.jboss.errai.ioc.rebind.ioc.codegen.builder.impl.StatementBuilder;
import org.jboss.errai.ioc.rebind.ioc.codegen.util.Stmt;
import org.junit.Test;

/**
 * Tests the generation of try/catch/finally blocks using the {@link StatementBuilder} API.
 * 
 * @author Christian Sadilek <csadilek@redhat.com>
 */
public class TryBlockBuilderTest extends AbstractStatementBuilderTest implements TryBlockBuilderTestResult {

  @Test
  public void testEmptyTryBlock() {
    String s = StatementBuilder.create()
        .try_()
        .finish()
        .toJavaString();

    assertEquals("Failed to generate empty try catch block", EMPTY_TRY_FINALLY_BLOCK, s);
  }
  
  @Test
  public void testTryFinallyBlock() {
    String s = StatementBuilder.create()
        .try_()
        .finish()
        .finally_()
        .finish()
        .toJavaString();

    assertEquals("Failed to generate empty try finally block", EMPTY_TRY_FINALLY_BLOCK, s);
  }
  
  @Test
  public void testTryCatchBlock() {
    String s = StatementBuilder.create()
        .try_()
        .finish()
        .catch_(Throwable.class, "t")
        .finish()
        .toJavaString();

    assertEquals("Failed to generate empty try catch block", EMPTY_TRY_CATCH_BLOCK, s);
  }
  
  @Test
  public void testTryCatchFinallyBlockEmpty() {
    String s = StatementBuilder.create()
        .try_()
        .finish()
        .catch_(Throwable.class, "t")
        .finish()
        .finally_()
        .finish()
        .toJavaString();

    assertEquals("Failed to generate empty try catch finally block", EMPTY_TRY_CATCH_FINALLY_BLOCK, s);
  }
  
  @Test
  public void testTryMultipleCatchFinallyBlock() {
    String s = StatementBuilder.create()
        .try_()
        .finish()
        .catch_(Exception.class, "e")
        .finish()
        .catch_(Throwable.class, "t")
        .finish()
        .finally_()
        .finish()
        .toJavaString();

    assertEquals("Failed to generate empty try catch finally block", EMPTY_TRY_MULTIPLE_CATCH_FINALLY_BLOCK, s);
  }
  
  @Test
  public void testTryCatchFinallyBlock() {
    String s = StatementBuilder.create()
        .try_()
        .append(Stmt.create().throw_(Exception.class))
        .finish()
        .catch_(Exception.class, "e")
        .append(Stmt.create().throw_(RuntimeException.class, Variable.get("e")))
        .finish()
        .finally_()
        .append(Stmt.create().load(0).returnValue())
        .finish()
        .toJavaString();

    assertEquals("Failed to generate try catch finally block", TRY_CATCH_FINALLY_BLOCK, s);
  }
}