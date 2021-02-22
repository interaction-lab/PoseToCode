/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview The interface for an object that owns a block's rendering SVG
 * elements.
 * @author fenichel@google.com (Rachel Fenichel)
 */

'use strict'

goog.provide('Blockly.blockRendering.IPathObject')

goog.requireType('Blockly.blockRendering.ConstantProvider')
goog.requireType('Blockly.Theme')

/**
 * An interface for a block's path object.
 * @param {!SVGElement} _root The root SVG element.
 * @param {!Blockly.blockRendering.ConstantProvider} _constants The renderer's
 *     constants.
 * @interface
 */
Blockly.blockRendering.IPathObject = function (_root, _constants) {}

/**
 * The primary path of the block.
 * @type {!SVGElement}
 */
Blockly.blockRendering.IPathObject.prototype.svgPath

/**
 * The renderer's constant provider.
 * @type {!Blockly.blockRendering.ConstantProvider}
 */
Blockly.blockRendering.IPathObject.prototype.constants

/**
 * The primary path of the block.
 * @type {!Blockly.Theme.BlockStyle}
 */
Blockly.blockRendering.IPathObject.prototype.style

/**
 * Holds the cursors svg element when the cursor is attached to the block.
 * This is null if there is no cursor on the block.
 * @type {SVGElement}
 */
Blockly.blockRendering.IPathObject.prototype.cursorSvg

/**
 * Holds the markers svg element when the marker is attached to the block.
 * This is null if there is no marker on the block.
 * @type {SVGElement}
 */
Blockly.blockRendering.IPathObject.prototype.markerSvg

/**
 * Set the path generated by the renderer onto the respective SVG element.
 * @param {string} pathString The path.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.setPath

/**
 * Apply the stored colours to the block's path, taking into account whether
 * the paths belong to a shadow block.
 * @param {!Blockly.Block} block The source block.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.applyColour

/**
 * Update the style.
 * @param {!Blockly.Theme.BlockStyle} blockStyle The block style to use.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.setStyle

/**
 * Flip the SVG paths in RTL.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.flipRTL

/**
 * Add the cursor svg to this block's svg group.
 * @param {SVGElement} cursorSvg The svg root of the cursor to be added to the
 *     block svg group.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.setCursorSvg

/**
 * Add the marker svg to this block's svg group.
 * @param {SVGElement} markerSvg The svg root of the marker to be added to the
 *     block svg group.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.setMarkerSvg

/**
 * Set whether the block shows a highlight or not.  Block highlighting is
 * often used to visually mark blocks currently being executed.
 * @param {boolean} highlighted True if highlighted.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.updateHighlighted

/**
 * Add or remove styling showing that a block is selected.
 * @param {boolean} enable True if selection is enabled, false otherwise.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.updateSelected

/**
 * Add or remove styling showing that a block is dragged over a delete area.
 * @param {boolean} enable True if the block is being dragged over a delete
 *     area, false otherwise.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.updateDraggingDelete

/**
 * Add or remove styling showing that a block is an insertion marker.
 * @param {boolean} enable True if the block is an insertion marker, false
 *     otherwise.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.updateInsertionMarker

/**
 * Add or remove styling showing that a block is movable.
 * @param {boolean} enable True if the block is movable, false otherwise.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.updateMovable

/**
 * Add or remove styling that shows that if the dragging block is dropped, this
 * block will be replaced.  If a shadow block, it will disappear.  Otherwise it
 * will bump.
 * @param {boolean} enable True if styling should be added.
 * @package
 */
Blockly.blockRendering.IPathObject.prototype.updateReplacementFade
