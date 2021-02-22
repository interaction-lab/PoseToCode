/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Dart for unit test blocks.
 * @author fraser@google.com (Neil Fraser)
 */
"use strict";

Blockly.Dart.unittest_main = function (block) {
  // Container for unit tests.
  const resultsVar = Blockly.Dart.variableDB_.getName(
    "unittestResults",
    Blockly.Names.DEVELOPER_VARIABLE_TYPE
  );
  const functionName = Blockly.Dart.provideFunction_("unittest_report", [
    "String " + Blockly.Dart.FUNCTION_NAME_PLACEHOLDER_ + "() {",
    "  // Create test report.",
    "  List report = [];",
    "  StringBuffer summary = new StringBuffer();",
    "  int fails = 0;",
    "  for (int x = 0; x < " + resultsVar + ".length; x++) {",
    "    if (" + resultsVar + "[x][0]) {",
    '      summary.write(".");',
    "    } else {",
    '      summary.write("F");',
    "      fails++;",
    '      report.add("");',
    '      report.add("FAIL: ${' + resultsVar + '[x][2]}");',
    "      report.add(" + resultsVar + "[x][1]);",
    "    }",
    "  }",
    "  report.insert(0, summary.toString());",
    '  report.add("");',
    '  report.add("Ran ${' + resultsVar + '.length} tests.");',
    '  report.add("");',
    "  if (fails != 0) {",
    '    report.add("FAILED (failures=$fails)");',
    "  } else {",
    '    report.add("OK");',
    "  }",
    '  return report.join("\\n");',
    "}",
  ]);
  // Setup global to hold test results.
  let code = resultsVar + " = [];\n";
  // Say which test suite this is.
  code +=
    "print('\\n====================\\n\\n" +
    "Running suite: " +
    block.getFieldValue("SUITE_NAME") +
    "');\n";
  // Run tests (unindented).
  code += Blockly.Dart.statementToCode(block, "DO")
    .replace(/^ {2}/, "")
    .replace(/\n {2}/g, "\n");
  // Print the report to the console (that's where errors will go anyway).
  code += "print(" + functionName + "());\n";
  // Destroy results.
  code += resultsVar + " = null;\n";
  return code;
};

Blockly.Dart.unittest_main.defineAssert_ = function () {
  const resultsVar = Blockly.Dart.variableDB_.getName(
    "unittestResults",
    Blockly.Names.DEVELOPER_VARIABLE_TYPE
  );
  const functionName = Blockly.Dart.provideFunction_("unittest_assertequals", [
    "void " +
      Blockly.Dart.FUNCTION_NAME_PLACEHOLDER_ +
      "(dynamic actual, dynamic expected, String message) {",
    "  // Asserts that a value equals another value.",
    "  if (" + resultsVar + " == null) {",
    '    throw "Orphaned assert: ${message}";',
    "  }",
    "  bool equals(a, b) {",
    "    if (a == b) {",
    "      return true;",
    "    } else if (a is List && b is List) {",
    "      if (a.length != b.length) {",
    "        return false;",
    "      }",
    "      for (num i = 0; i < a.length; i++) {",
    "        if (!equals(a[i], b[i])) {",
    "          return false;",
    "        }",
    "      }",
    "      return true;",
    "    }",
    "    return false;",
    "  }",
    "  if (equals(actual, expected)) {",
    "    " + resultsVar + '.add([true, "OK", message]);',
    "  } else {",
    "    " +
      resultsVar +
      ".add([false, " +
      '"Expected: $expected\\nActual: $actual", message]);',
    "  }",
    "}",
  ]);
  return functionName;
};

Blockly.Dart.unittest_assertequals = function (block) {
  // Asserts that a value equals another value.
  const message =
    Blockly.Dart.valueToCode(block, "MESSAGE", Blockly.Dart.ORDER_NONE) || "";
  const actual =
    Blockly.Dart.valueToCode(block, "ACTUAL", Blockly.Dart.ORDER_NONE) ||
    "null";
  const expected =
    Blockly.Dart.valueToCode(block, "EXPECTED", Blockly.Dart.ORDER_NONE) ||
    "null";
  return (
    Blockly.Dart.unittest_main.defineAssert_() +
    "(" +
    actual +
    ", " +
    expected +
    ", " +
    message +
    ");\n"
  );
};

Blockly.Dart.unittest_assertvalue = function (block) {
  // Asserts that a value is true, false, or null.
  const message =
    Blockly.Dart.valueToCode(block, "MESSAGE", Blockly.Dart.ORDER_NONE) || "";
  const actual =
    Blockly.Dart.valueToCode(block, "ACTUAL", Blockly.Dart.ORDER_NONE) ||
    "null";
  let expected = block.getFieldValue("EXPECTED");
  if (expected == "TRUE") {
    expected = "true";
  } else if (expected == "FALSE") {
    expected = "false";
  } else if (expected == "NULL") {
    expected = "null";
  }
  return (
    Blockly.Dart.unittest_main.defineAssert_() +
    "(" +
    actual +
    ", " +
    expected +
    ", " +
    message +
    ");\n"
  );
};

Blockly.Dart.unittest_fail = function (block) {
  // Always assert an error.
  const resultsVar = Blockly.Dart.variableDB_.getName(
    "unittestResults",
    Blockly.Names.DEVELOPER_VARIABLE_TYPE
  );
  const message = Blockly.Dart.quote_(block.getFieldValue("MESSAGE"));
  const functionName = Blockly.Dart.provideFunction_("unittest_fail", [
    "void " + Blockly.Dart.FUNCTION_NAME_PLACEHOLDER_ + "(String message) {",
    "  // Always assert an error.",
    "  if (" + resultsVar + " == null) {",
    '    throw "Orphaned assert fail: ${message}";',
    "  }",
    "  " + resultsVar + '.add([false, "Fail.", message]);',
    "}",
  ]);
  return functionName + "(" + message + ");\n";
};

Blockly.Dart.unittest_adjustindex = function (block) {
  let index =
    Blockly.Dart.valueToCode(block, "INDEX", Blockly.Dart.ORDER_ADDITIVE) ||
    "0";
  // Adjust index if using one-based indexing.
  if (block.workspace.options.oneBasedIndex) {
    if (Blockly.isNumber(index)) {
      // If the index is a naked number, adjust it right now.
      return [Number(index) + 1, Blockly.Dart.ORDER_ATOMIC];
    } else {
      // If the index is dynamic, adjust it in code.
      index = index + " + 1";
    }
  } else if (Blockly.isNumber(index)) {
    return [index, Blockly.Dart.ORDER_ATOMIC];
  }
  return [index, Blockly.Dart.ORDER_ADDITIVE];
};
