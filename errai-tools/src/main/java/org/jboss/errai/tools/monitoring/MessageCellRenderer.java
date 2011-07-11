/*
 * Copyright 2010 JBoss, a divison Red Hat, Inc
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

package org.jboss.errai.tools.monitoring;

import org.jboss.errai.bus.client.api.Message;
import org.mvel2.util.StringAppender;

import javax.swing.*;
import javax.swing.table.DefaultTableCellRenderer;
import java.awt.*;
import java.util.Map;

public class MessageCellRenderer extends DefaultTableCellRenderer {
  public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {
    String txt = renderMessage(value);
    setToolTipText(txt);
    return super.getTableCellRendererComponent(table, txt, isSelected, hasFocus, row, column);
  }

  public static String renderMessage(Object value) {

    if (value instanceof Message) {
      StringAppender appender = new StringAppender();
      Map<String, Object> vars = ((Message) value).getParts();

      boolean first = true;
      for (Map.Entry<String, Object> entry : vars.entrySet()) {
        if (first) {
          first = false;
        }
        else {
          appender.append(", ");
        }

        appender.append(entry.getKey()).append('=').append(entry.getValue());
      }

      return appender.toString();
    }
    return null;
  }
}
