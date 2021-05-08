/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Objects for rendering highlights on blocks.
 * @author fenichel@google.com (Rachel Fenichel)
 */
"use strict";

goog.provide("Blockly.geras.HighlightConstantProvider");

goog.require("Blockly.blockRendering.ConstantProvider");
goog.require("Blockly.utils.svgPaths");

/**
 * An object that provides constants for rendering highlights on blocks.
 * Some highlights are simple offsets of the parent paths and can be generated
 * programmatically.  Others, especially on curves, are just made out of piles
 * of constants and are hard to tweak.
 * @param {!Blockly.blockRendering.ConstantProvider} constants The rendering
 *   constants provider.
 * @constructor
 * @package
 */
Blockly.geras.HighlightConstantProvider = function (constants) {
  /**
   * The renderer's constant provider.
   * @type {!Blockly.blockRendering.ConstantProvider}
   */
  this.constantProvider = constants;

  /**
   * The offset between the block's main path and highlight path.
   * @type {number}
   * @package
   */
  this.OFFSET = 0.5;

  /**
   * The start point, which is offset in both X and Y, as an SVG path chunk.
   * @type {string}
   */
  this.START_POINT = Blockly.utils.svgPaths.moveBy(this.OFFSET, this.OFFSET);
};

/**
 * Initialize shape objects based on the constants set in the constructor.
 * @package
 */
Blockly.geras.HighlightConstantProvider.prototype.init = function () {
  /**
   * An object containing sizing and path information about inside corner
   * highlights.
   * @type {!Object}
   */
  this.INSIDE_CORNER = this.makeInsideCorner();

  /**
   * An object containing sizing and path information about outside corner
   * highlights.
   * @type {!Object}
   */
  this.OUTSIDE_CORNER = this.makeOutsideCorner();

  /**
   * An object containing sizing and path information about puzzle tab
   * highlights.
   * @type {!Object}
   */
  this.PUZZLE_TAB = this.makePuzzleTab();

  /**
   * An object containing sizing and path information about notch highlights.
   * @type {!Object}
   */
  this.NOTCH = this.makeNotch();

  /**
   * An object containing sizing and path information about highlights for
   * collapsed block indicators.
   * @type {!Object}
   */
  this.JAGGED_TEETH = this.makeJaggedTeeth();

  /**
   * An object containing sizing and path information about start hat
   * highlights.
   * @type {!Object}
   */
  this.START_HAT = this.makeStartHat();
};

/**
 * @return {!Object} An object containing sizing and path information about
 *     inside corner highlights.
 * @package
 */
Blockly.geras.HighlightConstantProvider.prototype.makeInsideCorner = function () {
  const radius = this.constantProvider.CORNER_RADIUS;
  const offset = this.OFFSET;

  /**
   * Distance from shape edge to intersect with a curved corner at 45 degrees.
   * Applies to highlighting on around the outside of a curve.
   * @const
   */
  const distance45outside = (1 - Math.SQRT1_2) * (radius + offset) - offset;

  const pathTopRtl =
    Blockly.utils.svgPaths.moveBy(distance45outside, distance45outside) +
    Blockly.utils.svgPaths.arc(
      "a",
      "0 0,0",
      radius,
      Blockly.utils.svgPaths.point(
        -distance45outside - offset,
        radius - distance45outside
      )
    );

  const pathBottomRtl = Blockly.utils.svgPaths.arc(
    "a",
    "0 0,0",
    radius + offset,
    Blockly.utils.svgPaths.point(radius + offset, radius + offset)
  );

  const pathBottomLtr =
    Blockly.utils.svgPaths.moveBy(distance45outside, -distance45outside) +
    Blockly.utils.svgPaths.arc(
      "a",
      "0 0,0",
      radius + offset,
      Blockly.utils.svgPaths.point(
        radius - distance45outside,
        distance45outside + offset
      )
    );

  return {
    width: radius + offset,
    height: radius,
    pathTop: function (rtl) {
      return rtl ? pathTopRtl : "";
    },
    pathBottom: function (rtl) {
      return rtl ? pathBottomRtl : pathBottomLtr;
    },
  };
};

/**
 * @return {!Object} An object containing sizing and path information about
 *     outside corner highlights.
 * @package
 */
Blockly.geras.HighlightConstantProvider.prototype.makeOutsideCorner = function () {
  const radius = this.constantProvider.CORNER_RADIUS;
  const offset = this.OFFSET;

  /**
   * Distance from shape edge to intersect with a curved corner at 45 degrees.
   * Applies to highlighting on around the inside of a curve.
   * @const
   */
  const distance45inside = (1 - Math.SQRT1_2) * (radius - offset) + offset;

  const topLeftStartX = distance45inside;
  const topLeftStartY = distance45inside;
  const topLeftCornerHighlightRtl =
    Blockly.utils.svgPaths.moveBy(topLeftStartX, topLeftStartY) +
    Blockly.utils.svgPaths.arc(
      "a",
      "0 0,1",
      radius - offset,
      Blockly.utils.svgPaths.point(
        radius - topLeftStartX,
        -topLeftStartY + offset
      )
    );
  /**
   * SVG path for drawing the highlight on the rounded top-left corner.
   * @const
   */
  const topLeftCornerHighlightLtr =
    Blockly.utils.svgPaths.moveBy(offset, radius) +
    Blockly.utils.svgPaths.arc(
      "a",
      "0 0,1",
      radius - offset,
      Blockly.utils.svgPaths.point(radius, -radius + offset)
    );

  const bottomLeftStartX = distance45inside;
  const bottomLeftStartY = -distance45inside;
  const bottomLeftPath =
    Blockly.utils.svgPaths.moveBy(bottomLeftStartX, bottomLeftStartY) +
    Blockly.utils.svgPaths.arc(
      "a",
      "0 0,1",
      radius - offset,
      Blockly.utils.svgPaths.point(
        -bottomLeftStartX + offset,
        -bottomLeftStartY - radius
      )
    );

  return {
    height: radius,
    topLeft: function (rtl) {
      return rtl ? topLeftCornerHighlightRtl : topLeftCornerHighlightLtr;
    },
    bottomLeft: function () {
      return bottomLeftPath;
    },
  };
};

/**
 * @return {!Object} An object containing sizing and path information about
 *     puzzle tab highlights.
 * @package
 */
Blockly.geras.HighlightConstantProvider.prototype.makePuzzleTab = function () {
  const width = this.constantProvider.TAB_WIDTH;
  const height = this.constantProvider.TAB_HEIGHT;

  // This is how much of the vertical block edge is actually drawn by the puzzle
  // tab.
  const verticalOverlap = 2.5;

  const highlightRtlUp =
    Blockly.utils.svgPaths.moveBy(-2, -height + verticalOverlap + 0.9) +
    Blockly.utils.svgPaths.lineTo(width * -0.45, -2.1);

  const highlightRtlDown =
    Blockly.utils.svgPaths.lineOnAxis("v", verticalOverlap) +
    Blockly.utils.svgPaths.moveBy(-width * 0.97, 2.5) +
    Blockly.utils.svgPaths.curve("q", [
      Blockly.utils.svgPaths.point(-width * 0.05, 10),
      Blockly.utils.svgPaths.point(width * 0.3, 9.5),
    ]) +
    Blockly.utils.svgPaths.moveBy(width * 0.67, -1.9) +
    Blockly.utils.svgPaths.lineOnAxis("v", verticalOverlap);

  const highlightLtrUp =
    Blockly.utils.svgPaths.lineOnAxis("v", -1.5) +
    Blockly.utils.svgPaths.moveBy(width * -0.92, -0.5) +
    Blockly.utils.svgPaths.curve("q", [
      Blockly.utils.svgPaths.point(width * -0.19, -5.5),
      Blockly.utils.svgPaths.point(0, -11),
    ]) +
    Blockly.utils.svgPaths.moveBy(width * 0.92, 1);

  const highlightLtrDown =
    Blockly.utils.svgPaths.moveBy(-5, height - 0.7) +
    Blockly.utils.svgPaths.lineTo(width * 0.46, -2.1);

  return {
    width: width,
    height: height,
    pathUp: function (rtl) {
      return rtl ? highlightRtlUp : highlightLtrUp;
    },
    pathDown: function (rtl) {
      return rtl ? highlightRtlDown : highlightLtrDown;
    },
  };
};

/**
 * @return {!Object} An object containing sizing and path information about
 *     notch highlights.
 * @package
 */
Blockly.geras.HighlightConstantProvider.prototype.makeNotch = function () {
  // This is only for the previous connection.
  const pathLeft =
    Blockly.utils.svgPaths.lineOnAxis("h", this.OFFSET) +
    this.constantProvider.NOTCH.pathLeft;
  return {
    pathLeft: pathLeft,
  };
};

/**
 * @return {!Object} An object containing sizing and path information about
 *     collapsed block edge highlights.
 * @package
 */
Blockly.geras.HighlightConstantProvider.prototype.makeJaggedTeeth = function () {
  const pathLeft =
    Blockly.utils.svgPaths.lineTo(5.1, 2.6) +
    Blockly.utils.svgPaths.moveBy(-10.2, 6.8) +
    Blockly.utils.svgPaths.lineTo(5.1, 2.6);
  return {
    pathLeft: pathLeft,
    height: 12,
    width: 10.2,
  };
};

/**
 * @return {!Object} An object containing sizing and path information about
 *     start highlights.
 * @package
 */
Blockly.geras.HighlightConstantProvider.prototype.makeStartHat = function () {
  const hatHeight = this.constantProvider.START_HAT.height;
  const pathRtl =
    Blockly.utils.svgPaths.moveBy(25, -8.7) +
    Blockly.utils.svgPaths.curve("c", [
      Blockly.utils.svgPaths.point(29.7, -6.2),
      Blockly.utils.svgPaths.point(57.2, -0.5),
      Blockly.utils.svgPaths.point(75, 8.7),
    ]);

  const pathLtr =
    Blockly.utils.svgPaths.curve("c", [
      Blockly.utils.svgPaths.point(17.8, -9.2),
      Blockly.utils.svgPaths.point(45.3, -14.9),
      Blockly.utils.svgPaths.point(75, -8.7),
    ]) + Blockly.utils.svgPaths.moveTo(100.5, hatHeight + 0.5);
  return {
    path: function (rtl) {
      return rtl ? pathRtl : pathLtr;
    },
  };
};
