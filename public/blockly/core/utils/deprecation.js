/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper function for warning developers about deprecations.
 * This method is not specific to Blockly.
 * @author fenichel@google.com (Rachel Fenichel);
 */
"use strict";

goog.provide("Blockly.utils.deprecation");

/**
 * Warn developers that a function is deprecated.
 * @param {string} functionName The name of the function.
 * @param {string} deprecationDate The date when the function was deprecated.
 *     Prefer 'month yyyy' or 'quarter yyyy' format.
 * @param {string} deletionDate The date when the function will be deleted, in
 *     the same format as the deprecation date.
 * @param {string=} opt_use The name of a function to use instead, if any.
 * @package
 */
Blockly.utils.deprecation.warn = function (
  functionName,
  deprecationDate,
  deletionDate,
  opt_use
) {
  let msg =
    functionName +
    " was deprecated on " +
    deprecationDate +
    " and will be deleted on " +
    deletionDate +
    ".";
  if (opt_use) {
    msg += "\nUse " + opt_use + " instead.";
  }
  console.warn(msg);
};
