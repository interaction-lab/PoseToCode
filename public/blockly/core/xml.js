/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview XML reader and writer.
 * @author fraser@google.com (Neil Fraser)
 */
"use strict";

/**
 * @name Blockly.Xml
 * @namespace
 */
goog.provide("Blockly.Xml");

goog.require("Blockly.constants");
goog.require("Blockly.Events");
goog.require("Blockly.Events.BlockCreate");
goog.require("Blockly.Events.FinishedLoading");
goog.require("Blockly.Events.VarCreate");
goog.require("Blockly.utils");
goog.require("Blockly.utils.dom");
goog.require("Blockly.utils.global");
goog.require("Blockly.utils.xml");

/**
 * Encode a block tree as XML.
 * @param {!Blockly.Workspace} workspace The workspace containing blocks.
 * @param {boolean=} opt_noId True if the encoder should skip the block IDs.
 * @return {!Element} XML DOM element.
 */
Blockly.Xml.workspaceToDom = function (workspace, opt_noId) {
  const xml = Blockly.utils.xml.createElement("xml");
  const variablesElement = Blockly.Xml.variablesToDom(
    Blockly.Variables.allUsedVarModels(workspace)
  );
  if (variablesElement.hasChildNodes()) {
    xml.appendChild(variablesElement);
  }
  const comments = workspace.getTopComments(true);
  for (var i = 0, comment; (comment = comments[i]); i++) {
    xml.appendChild(comment.toXmlWithXY(opt_noId));
  }
  const blocks = workspace.getTopBlocks(true);
  for (var i = 0, block; (block = blocks[i]); i++) {
    xml.appendChild(Blockly.Xml.blockToDomWithXY(block, opt_noId));
  }
  return xml;
};

/**
 * Encode a list of variables as XML.
 * @param {!Array.<!Blockly.VariableModel>} variableList List of all variable
 *     models.
 * @return {!Element} Tree of XML elements.
 */
Blockly.Xml.variablesToDom = function (variableList) {
  const variables = Blockly.utils.xml.createElement("variables");
  for (var i = 0, variable; (variable = variableList[i]); i++) {
    const element = Blockly.utils.xml.createElement("variable");
    element.appendChild(Blockly.utils.xml.createTextNode(variable.name));
    if (variable.type) {
      element.setAttribute("type", variable.type);
    }
    element.id = variable.getId();
    variables.appendChild(element);
  }
  return variables;
};

/**
 * Encode a block subtree as XML with XY coordinates.
 * @param {!Blockly.Block} block The root block to encode.
 * @param {boolean=} opt_noId True if the encoder should skip the block ID.
 * @return {!Element|!DocumentFragment} Tree of XML elements or an empty document
 *     fragment if the block was an insertion marker.
 */
Blockly.Xml.blockToDomWithXY = function (block, opt_noId) {
  if (block.isInsertionMarker()) {
    // Skip over insertion markers.
    block = block.getChildren(false)[0];
    if (!block) {
      // Disappears when appended.
      return new DocumentFragment();
    }
  }

  let width; // Not used in LTR.
  if (block.workspace.RTL) {
    width = block.workspace.getWidth();
  }

  const element = Blockly.Xml.blockToDom(block, opt_noId);
  const xy = block.getRelativeToSurfaceXY();
  element.setAttribute(
    "x",
    Math.round(block.workspace.RTL ? width - xy.x : xy.x)
  );
  element.setAttribute("y", Math.round(xy.y));
  return element;
};

/**
 * Encode a field as XML.
 * @param {!Blockly.Field} field The field to encode.
 * @return {Element} XML element, or null if the field did not need to be
 *     serialized.
 * @private
 */
Blockly.Xml.fieldToDom_ = function (field) {
  if (field.isSerializable()) {
    const container = Blockly.utils.xml.createElement("field");
    container.setAttribute("name", field.name || "");
    return field.toXml(container);
  }
  return null;
};

/**
 * Encode all of a block's fields as XML and attach them to the given tree of
 * XML elements.
 * @param {!Blockly.Block} block A block with fields to be encoded.
 * @param {!Element} element The XML element to which the field DOM should be
 *     attached.
 * @private
 */
Blockly.Xml.allFieldsToDom_ = function (block, element) {
  for (var i = 0, input; (input = block.inputList[i]); i++) {
    for (var j = 0, field; (field = input.fieldRow[j]); j++) {
      const fieldDom = Blockly.Xml.fieldToDom_(field);
      if (fieldDom) {
        element.appendChild(fieldDom);
      }
    }
  }
};

/**
 * Encode a block subtree as XML.
 * @param {!Blockly.Block} block The root block to encode.
 * @param {boolean=} opt_noId True if the encoder should skip the block ID.
 * @return {!Element|!DocumentFragment} Tree of XML elements or an empty document
 *     fragment if the block was an insertion marker.
 */
Blockly.Xml.blockToDom = function (block, opt_noId) {
  // Skip over insertion markers.
  if (block.isInsertionMarker()) {
    const child = block.getChildren(false)[0];
    if (child) {
      return Blockly.Xml.blockToDom(child);
    } else {
      // Disappears when appended.
      return new DocumentFragment();
    }
  }

  const element = Blockly.utils.xml.createElement(
    block.isShadow() ? "shadow" : "block"
  );
  element.setAttribute("type", block.type);
  if (!opt_noId) {
    // It's important to use setAttribute here otherwise IE11 won't serialize
    // the block's id when domToText is called.
    element.setAttribute("id", block.id);
  }
  if (block.mutationToDom) {
    // Custom data for an advanced block.
    const mutation = block.mutationToDom();
    if (mutation && (mutation.hasChildNodes() || mutation.hasAttributes())) {
      element.appendChild(mutation);
    }
  }

  Blockly.Xml.allFieldsToDom_(block, element);

  const commentText = block.getCommentText();
  if (commentText) {
    const size = block.commentModel.size;
    const pinned = block.commentModel.pinned;

    const commentElement = Blockly.utils.xml.createElement("comment");
    commentElement.appendChild(Blockly.utils.xml.createTextNode(commentText));
    commentElement.setAttribute("pinned", pinned);
    commentElement.setAttribute("h", size.height);
    commentElement.setAttribute("w", size.width);

    element.appendChild(commentElement);
  }

  if (block.data) {
    const dataElement = Blockly.utils.xml.createElement("data");
    dataElement.appendChild(Blockly.utils.xml.createTextNode(block.data));
    element.appendChild(dataElement);
  }

  for (var i = 0, input; (input = block.inputList[i]); i++) {
    var container;
    let empty = true;
    if (input.type == Blockly.DUMMY_INPUT) {
      continue;
    } else {
      const childBlock = input.connection.targetBlock();
      if (input.type == Blockly.INPUT_VALUE) {
        container = Blockly.utils.xml.createElement("value");
      } else if (input.type == Blockly.NEXT_STATEMENT) {
        container = Blockly.utils.xml.createElement("statement");
      }
      var shadow = input.connection.getShadowDom();
      if (shadow && (!childBlock || !childBlock.isShadow())) {
        container.appendChild(Blockly.Xml.cloneShadow_(shadow, opt_noId));
      }
      if (childBlock) {
        var elem = Blockly.Xml.blockToDom(childBlock, opt_noId);
        if (elem.nodeType == Blockly.utils.dom.NodeType.ELEMENT_NODE) {
          container.appendChild(elem);
          empty = false;
        }
      }
    }
    container.setAttribute("name", input.name);
    if (!empty) {
      element.appendChild(container);
    }
  }
  if (
    block.inputsInline != undefined &&
    block.inputsInline != block.inputsInlineDefault
  ) {
    element.setAttribute("inline", block.inputsInline);
  }
  if (block.isCollapsed()) {
    element.setAttribute("collapsed", true);
  }
  if (!block.isEnabled()) {
    element.setAttribute("disabled", true);
  }
  if (!block.isDeletable() && !block.isShadow()) {
    element.setAttribute("deletable", false);
  }
  if (!block.isMovable() && !block.isShadow()) {
    element.setAttribute("movable", false);
  }
  if (!block.isEditable()) {
    element.setAttribute("editable", false);
  }

  const nextBlock = block.getNextBlock();
  if (nextBlock) {
    var elem = Blockly.Xml.blockToDom(nextBlock, opt_noId);
    if (elem.nodeType == Blockly.utils.dom.NodeType.ELEMENT_NODE) {
      var container = Blockly.utils.xml.createElement("next");
      container.appendChild(elem);
      element.appendChild(container);
    }
  }
  var shadow = block.nextConnection && block.nextConnection.getShadowDom();
  if (shadow && (!nextBlock || !nextBlock.isShadow())) {
    container.appendChild(Blockly.Xml.cloneShadow_(shadow, opt_noId));
  }

  return element;
};

/**
 * Deeply clone the shadow's DOM so that changes don't back-wash to the block.
 * @param {!Element} shadow A tree of XML elements.
 * @param {boolean=} opt_noId True if the encoder should skip the block ID.
 * @return {!Element} A tree of XML elements.
 * @private
 */
Blockly.Xml.cloneShadow_ = function (shadow, opt_noId) {
  shadow = shadow.cloneNode(true);
  // Walk the tree looking for whitespace.  Don't prune whitespace in a tag.
  let node = shadow;
  let textNode;
  while (node) {
    if (opt_noId && node.nodeName == "shadow") {
      // Strip off IDs from shadow blocks.  There should never be a 'block' as
      // a child of a 'shadow', so no need to check that.
      node.removeAttribute("id");
    }
    if (node.firstChild) {
      node = node.firstChild;
    } else {
      while (node && !node.nextSibling) {
        textNode = node;
        node = node.parentNode;
        if (
          textNode.nodeType == Blockly.utils.dom.NodeType.TEXT_NODE &&
          textNode.data.trim() == "" &&
          node.firstChild != textNode
        ) {
          // Prune whitespace after a tag.
          Blockly.utils.dom.removeNode(textNode);
        }
      }
      if (node) {
        textNode = node;
        node = node.nextSibling;
        if (
          textNode.nodeType == Blockly.utils.dom.NodeType.TEXT_NODE &&
          textNode.data.trim() == ""
        ) {
          // Prune whitespace before a tag.
          Blockly.utils.dom.removeNode(textNode);
        }
      }
    }
  }
  return shadow;
};

/**
 * Converts a DOM structure into plain text.
 * Currently the text format is fairly ugly: all one line with no whitespace,
 * unless the DOM itself has whitespace built-in.
 * @param {!Node} dom A tree of XML nodes.
 * @return {string} Text representation.
 */
Blockly.Xml.domToText = function (dom) {
  const text = Blockly.utils.xml.domToText(dom);
  // Unpack self-closing tags.  These tags fail when embedded in HTML.
  // <block name="foo"/> -> <block name="foo"></block>
  return text.replace(/<(\w+)([^<]*)\/>/g, "<$1$2></$1>");
};

/**
 * Converts a DOM structure into properly indented text.
 * @param {!Node} dom A tree of XML elements.
 * @return {string} Text representation.
 */
Blockly.Xml.domToPrettyText = function (dom) {
  // This function is not guaranteed to be correct for all XML.
  // But it handles the XML that Blockly generates.
  const blob = Blockly.Xml.domToText(dom);
  // Place every open and close tag on its own line.
  const lines = blob.split("<");
  // Indent every line.
  let indent = "";
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line[0] == "/") {
      indent = indent.substring(2);
    }
    lines[i] = indent + "<" + line;
    if (line[0] != "/" && line.slice(-2) != "/>") {
      indent += "  ";
    }
  }
  // Pull simple tags back together.
  // E.g. <foo></foo>
  let text = lines.join("\n");
  text = text.replace(/(<(\w+)\b[^>]*>[^\n]*)\n *<\/\2>/g, "$1</$2>");
  // Trim leading blank line.
  return text.replace(/^\n/, "");
};

/**
 * Converts an XML string into a DOM structure.
 * @param {string} text An XML string.
 * @return {!Element} A DOM object representing the singular child of the
 *     document element.
 * @throws if the text doesn't parse.
 */
Blockly.Xml.textToDom = function (text) {
  const doc = Blockly.utils.xml.textToDomDocument(text);
  if (
    !doc ||
    !doc.documentElement ||
    doc.getElementsByTagName("parsererror").length
  ) {
    throw Error("textToDom was unable to parse: " + text);
  }
  return doc.documentElement;
};

/**
 * Clear the given workspace then decode an XML DOM and
 * create blocks on the workspace.
 * @param {!Element} xml XML DOM.
 * @param {!Blockly.Workspace} workspace The workspace.
 * @return {Array.<string>} An array containing new block ids.
 */
Blockly.Xml.clearWorkspaceAndLoadFromXml = function (xml, workspace) {
  workspace.setResizesEnabled(false);
  workspace.clear();
  const blockIds = Blockly.Xml.domToWorkspace(xml, workspace);
  workspace.setResizesEnabled(true);
  return blockIds;
};

/**
 * Decode an XML DOM and create blocks on the workspace.
 * @param {!Element} xml XML DOM.
 * @param {!Blockly.Workspace} workspace The workspace.
 * @return {!Array.<string>} An array containing new block IDs.
 * @suppress {strictModuleDepCheck} Suppress module check while workspace
 *     comments are not bundled in.
 */
Blockly.Xml.domToWorkspace = function (xml, workspace) {
  if (xml instanceof Blockly.Workspace) {
    const swap = xml;
    // Closure Compiler complains here because the arguments are reversed.
    /** @suppress {checkTypes} */
    xml = workspace;
    workspace = swap;
    console.warn(
      "Deprecated call to Blockly.Xml.domToWorkspace, " + "swap the arguments."
    );
  }

  let width; // Not used in LTR.
  if (workspace.RTL) {
    width = workspace.getWidth();
  }
  const newBlockIds = []; // A list of block IDs added by this call.
  Blockly.utils.dom.startTextWidthCache();
  const existingGroup = Blockly.Events.getGroup();
  if (!existingGroup) {
    Blockly.Events.setGroup(true);
  }

  // Disable workspace resizes as an optimization.
  if (workspace.setResizesEnabled) {
    workspace.setResizesEnabled(false);
  }
  let variablesFirst = true;
  try {
    for (var i = 0, xmlChild; (xmlChild = xml.childNodes[i]); i++) {
      const name = xmlChild.nodeName.toLowerCase();
      const xmlChildElement = /** @type {!Element} */ (xmlChild);
      if (name == "block" || (name == "shadow" && !Blockly.Events.recordUndo)) {
        // Allow top-level shadow blocks if recordUndo is disabled since
        // that means an undo is in progress.  Such a block is expected
        // to be moved to a nested destination in the next operation.
        const block = Blockly.Xml.domToBlock(xmlChildElement, workspace);
        newBlockIds.push(block.id);
        const blockX = xmlChildElement.hasAttribute("x")
          ? parseInt(xmlChildElement.getAttribute("x"), 10)
          : 10;
        const blockY = xmlChildElement.hasAttribute("y")
          ? parseInt(xmlChildElement.getAttribute("y"), 10)
          : 10;
        if (!isNaN(blockX) && !isNaN(blockY)) {
          block.moveBy(workspace.RTL ? width - blockX : blockX, blockY);
        }
        variablesFirst = false;
      } else if (name == "shadow") {
        throw TypeError("Shadow block cannot be a top-level block.");
      } else if (name == "comment") {
        if (workspace.rendered) {
          if (!Blockly.WorkspaceCommentSvg) {
            console.warn(
              "Missing require for Blockly.WorkspaceCommentSvg, " +
                "ignoring workspace comment."
            );
          } else {
            Blockly.WorkspaceCommentSvg.fromXml(
              xmlChildElement,
              workspace,
              width
            );
          }
        } else {
          if (!Blockly.WorkspaceComment) {
            console.warn(
              "Missing require for Blockly.WorkspaceComment, " +
                "ignoring workspace comment."
            );
          } else {
            Blockly.WorkspaceComment.fromXml(xmlChildElement, workspace);
          }
        }
      } else if (name == "variables") {
        if (variablesFirst) {
          Blockly.Xml.domToVariables(xmlChildElement, workspace);
        } else {
          throw Error(
            "'variables' tag must exist once before block and " +
              "shadow tag elements in the workspace XML, but it was found in " +
              "another location."
          );
        }
        variablesFirst = false;
      }
    }
  } finally {
    if (!existingGroup) {
      Blockly.Events.setGroup(false);
    }
    Blockly.utils.dom.stopTextWidthCache();
  }
  // Re-enable workspace resizing.
  if (workspace.setResizesEnabled) {
    workspace.setResizesEnabled(true);
  }
  Blockly.Events.fire(new Blockly.Events.FinishedLoading(workspace));
  return newBlockIds;
};

/**
 * Decode an XML DOM and create blocks on the workspace. Position the new
 * blocks immediately below prior blocks, aligned by their starting edge.
 * @param {!Element} xml The XML DOM.
 * @param {!Blockly.Workspace} workspace The workspace to add to.
 * @return {Array.<string>} An array containing new block IDs.
 */
Blockly.Xml.appendDomToWorkspace = function (xml, workspace) {
  let bbox; // Bounding box of the current blocks.
  // First check if we have a workspaceSvg, otherwise the blocks have no shape
  // and the position does not matter.
  if (Object.prototype.hasOwnProperty.call(workspace, "scale")) {
    bbox = workspace.getBlocksBoundingBox();
  }
  // Load the new blocks into the workspace and get the IDs of the new blocks.
  const newBlockIds = Blockly.Xml.domToWorkspace(xml, workspace);
  if (bbox && bbox.top != bbox.bottom) {
    // check if any previous block
    let offsetY = 0; // offset to add to y of the new block
    let offsetX = 0;
    const farY = bbox.bottom; // bottom position
    const topX = workspace.RTL ? bbox.right : bbox.left; // x of bounding box
    // Check position of the new blocks.
    let newLeftX = Infinity; // x of top left corner
    let newRightX = -Infinity; // x of top right corner
    let newY = Infinity; // y of top corner
    const ySeparation = 10;
    for (var i = 0; i < newBlockIds.length; i++) {
      const blockXY = workspace
        .getBlockById(newBlockIds[i])
        .getRelativeToSurfaceXY();
      if (blockXY.y < newY) {
        newY = blockXY.y;
      }
      if (blockXY.x < newLeftX) {
        // if we left align also on x
        newLeftX = blockXY.x;
      }
      if (blockXY.x > newRightX) {
        // if we right align also on x
        newRightX = blockXY.x;
      }
    }
    offsetY = farY - newY + ySeparation;
    offsetX = workspace.RTL ? topX - newRightX : topX - newLeftX;
    for (var i = 0; i < newBlockIds.length; i++) {
      const block = workspace.getBlockById(newBlockIds[i]);
      block.moveBy(offsetX, offsetY);
    }
  }
  return newBlockIds;
};

/**
 * Decode an XML block tag and create a block (and possibly sub blocks) on the
 * workspace.
 * @param {!Element} xmlBlock XML block element.
 * @param {!Blockly.Workspace} workspace The workspace.
 * @return {!Blockly.Block} The root block created.
 */
Blockly.Xml.domToBlock = function (xmlBlock, workspace) {
  if (xmlBlock instanceof Blockly.Workspace) {
    const swap = xmlBlock;
    // Closure Compiler complains here because the arguments are reversed.
    /** @suppress {checkTypes} */
    xmlBlock = /** @type {!Element} */ (workspace);
    workspace = swap;
    console.warn(
      "Deprecated call to Blockly.Xml.domToBlock, " + "swap the arguments."
    );
  }
  // Create top-level block.
  Blockly.Events.disable();
  const variablesBeforeCreation = workspace.getAllVariables();
  try {
    var topBlock = Blockly.Xml.domToBlockHeadless_(xmlBlock, workspace);
    // Generate list of all blocks.
    const blocks = topBlock.getDescendants(false);
    if (workspace.rendered) {
      // Wait to track connections to speed up assembly.
      topBlock.setConnectionTracking(false);
      // Render each block.
      for (var i = blocks.length - 1; i >= 0; i--) {
        blocks[i].initSvg();
      }
      for (var i = blocks.length - 1; i >= 0; i--) {
        blocks[i].render(false);
      }
      // Populating the connection database may be deferred until after the
      // blocks have rendered.
      setTimeout(function () {
        if (!topBlock.disposed) {
          topBlock.setConnectionTracking(true);
        }
      }, 1);
      topBlock.updateDisabled();
      // Allow the scrollbars to resize and move based on the new contents.
      // TODO(@picklesrus): #387. Remove when domToBlock avoids resizing.
      workspace.resizeContents();
    } else {
      for (var i = blocks.length - 1; i >= 0; i--) {
        blocks[i].initModel();
      }
    }
  } finally {
    Blockly.Events.enable();
  }
  if (Blockly.Events.isEnabled()) {
    const newVariables = Blockly.Variables.getAddedVariables(
      workspace,
      variablesBeforeCreation
    );
    // Fire a VarCreate event for each (if any) new variable created.
    for (var i = 0; i < newVariables.length; i++) {
      const thisVariable = newVariables[i];
      Blockly.Events.fire(new Blockly.Events.VarCreate(thisVariable));
    }
    // Block events come after var events, in case they refer to newly created
    // variables.
    Blockly.Events.fire(new Blockly.Events.BlockCreate(topBlock));
  }
  return topBlock;
};

/**
 * Decode an XML list of variables and add the variables to the workspace.
 * @param {!Element} xmlVariables List of XML variable elements.
 * @param {!Blockly.Workspace} workspace The workspace to which the variable
 *     should be added.
 */
Blockly.Xml.domToVariables = function (xmlVariables, workspace) {
  for (var i = 0, xmlChild; (xmlChild = xmlVariables.childNodes[i]); i++) {
    if (xmlChild.nodeType != Blockly.utils.dom.NodeType.ELEMENT_NODE) {
      continue; // Skip text nodes.
    }
    const type = xmlChild.getAttribute("type");
    const id = xmlChild.getAttribute("id");
    const name = xmlChild.textContent;

    workspace.createVariable(name, type, id);
  }
};

/**
 * Decode an XML block tag and create a block (and possibly sub blocks) on the
 * workspace.
 * @param {!Element} xmlBlock XML block element.
 * @param {!Blockly.Workspace} workspace The workspace.
 * @return {!Blockly.Block} The root block created.
 * @private
 */
Blockly.Xml.domToBlockHeadless_ = function (xmlBlock, workspace) {
  let block = null;
  const prototypeName = xmlBlock.getAttribute("type");
  if (!prototypeName) {
    throw TypeError("Block type unspecified: " + xmlBlock.outerHTML);
  }
  const id = xmlBlock.getAttribute("id");
  block = workspace.newBlock(prototypeName, id);

  let blockChild = null;
  for (var i = 0, xmlChild; (xmlChild = xmlBlock.childNodes[i]); i++) {
    if (xmlChild.nodeType == Blockly.utils.dom.NodeType.TEXT_NODE) {
      // Ignore any text at the <block> level.  It's all whitespace anyway.
      continue;
    }
    var input;

    // Find any enclosed blocks or shadows in this tag.
    let childBlockElement = null;
    let childShadowElement = null;
    for (var j = 0, grandchild; (grandchild = xmlChild.childNodes[j]); j++) {
      if (grandchild.nodeType == Blockly.utils.dom.NodeType.ELEMENT_NODE) {
        if (grandchild.nodeName.toLowerCase() == "block") {
          childBlockElement = /** @type {!Element} */ (grandchild);
        } else if (grandchild.nodeName.toLowerCase() == "shadow") {
          childShadowElement = /** @type {!Element} */ (grandchild);
        }
      }
    }

    var callInitSvg = false;
    const name = xmlChild.getAttribute("name");
    const xmlChildElement = /** @type {!Element} */ (xmlChild);
    switch (xmlChild.nodeName.toLowerCase()) {
      case "mutation":
        // Custom data for an advanced block.
        if (block.domToMutation) {
          block.domToMutation(xmlChildElement);
          if (block.initSvg) {
            // Mutation may have added some elements that need initializing.
            callInitSvg = true;
          }
        }
        break;
      case "comment":
        if (!Blockly.Comment) {
          console.warn(
            "Missing require for Blockly.Comment, " + "ignoring block comment."
          );
          break;
        }
        var text = xmlChildElement.textContent;
        var pinned = xmlChildElement.getAttribute("pinned") == "true";
        var width = parseInt(xmlChildElement.getAttribute("w"), 10);
        var height = parseInt(xmlChildElement.getAttribute("h"), 10);

        block.setCommentText(text);
        block.commentModel.pinned = pinned;
        if (!isNaN(width) && !isNaN(height)) {
          block.commentModel.size = new Blockly.utils.Size(width, height);
        }

        if (pinned && block.getCommentIcon && !block.isInFlyout) {
          setTimeout(function () {
            block.getCommentIcon().setVisible(true);
          }, 1);
        }
        break;
      case "data":
        block.data = xmlChild.textContent;
        break;
      case "title":
      // Titles were renamed to field in December 2013.
      // Fall through.
      case "field":
        Blockly.Xml.domToField_(block, name, xmlChildElement);
        break;
      case "value":
      case "statement":
        input = block.getInput(name);
        if (!input) {
          console.warn(
            "Ignoring non-existent input " + name + " in block " + prototypeName
          );
          break;
        }
        if (childBlockElement) {
          blockChild = Blockly.Xml.domToBlockHeadless_(
            childBlockElement,
            workspace
          );
          if (blockChild.outputConnection) {
            input.connection.connect(blockChild.outputConnection);
          } else if (blockChild.previousConnection) {
            input.connection.connect(blockChild.previousConnection);
          } else {
            throw TypeError(
              "Child block does not have output or previous statement."
            );
          }
        }
        // Set shadow after so we don't create a shadow we delete immediately.
        if (childShadowElement) {
          input.connection.setShadowDom(childShadowElement);
        }
        break;
      case "next":
        if (childBlockElement) {
          if (!block.nextConnection) {
            throw TypeError("Next statement does not exist.");
          }
          // If there is more than one XML 'next' tag.
          if (block.nextConnection.isConnected()) {
            throw TypeError("Next statement is already connected.");
          }
          blockChild = Blockly.Xml.domToBlockHeadless_(
            childBlockElement,
            workspace
          );
          if (!blockChild.previousConnection) {
            throw TypeError("Next block does not have previous statement.");
          }
          block.nextConnection.connect(blockChild.previousConnection);
        }
        // Set shadow after so we don't create a shadow we delete immediately.
        if (childShadowElement && block.nextConnection) {
          block.nextConnection.setShadowDom(childShadowElement);
        }
        break;
      default:
        // Unknown tag; ignore.  Same principle as HTML parsers.
        console.warn("Ignoring unknown tag: " + xmlChild.nodeName);
    }
  }

  if (callInitSvg) {
    // InitSvg needs to be called after variable fields are loaded.
    block.initSvg();
  }

  const inline = xmlBlock.getAttribute("inline");
  if (inline) {
    block.setInputsInline(inline == "true");
  }
  const disabled = xmlBlock.getAttribute("disabled");
  if (disabled) {
    block.setEnabled(disabled != "true" && disabled != "disabled");
  }
  const deletable = xmlBlock.getAttribute("deletable");
  if (deletable) {
    block.setDeletable(deletable == "true");
  }
  const movable = xmlBlock.getAttribute("movable");
  if (movable) {
    block.setMovable(movable == "true");
  }
  const editable = xmlBlock.getAttribute("editable");
  if (editable) {
    block.setEditable(editable == "true");
  }
  const collapsed = xmlBlock.getAttribute("collapsed");
  if (collapsed) {
    block.setCollapsed(collapsed == "true");
  }
  if (xmlBlock.nodeName.toLowerCase() == "shadow") {
    // Ensure all children are also shadows.
    const children = block.getChildren(false);
    for (var i = 0, child; (child = children[i]); i++) {
      if (!child.isShadow()) {
        throw TypeError("Shadow block not allowed non-shadow child.");
      }
    }
    // Ensure this block doesn't have any variable inputs.
    if (block.getVarModels().length) {
      throw TypeError("Shadow blocks cannot have variable references.");
    }
    block.setShadow(true);
  }
  return block;
};

/**
 * Decode an XML field tag and set the value of that field on the given block.
 * @param {!Blockly.Block} block The block that is currently being deserialized.
 * @param {string} fieldName The name of the field on the block.
 * @param {!Element} xml The field tag to decode.
 * @private
 */
Blockly.Xml.domToField_ = function (block, fieldName, xml) {
  const field = block.getField(fieldName);
  if (!field) {
    console.warn(
      "Ignoring non-existent field " + fieldName + " in block " + block.type
    );
    return;
  }
  field.fromXml(xml);
};

/**
 * Remove any 'next' block (statements in a stack).
 * @param {!Element|!DocumentFragment} xmlBlock XML block element or an empty
 *     DocumentFragment if the block was an insertion marker.
 */
Blockly.Xml.deleteNext = function (xmlBlock) {
  for (var i = 0, child; (child = xmlBlock.childNodes[i]); i++) {
    if (child.nodeName.toLowerCase() == "next") {
      xmlBlock.removeChild(child);
      break;
    }
  }
};
