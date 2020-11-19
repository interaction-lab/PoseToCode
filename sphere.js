Blockly.Blocks['create_sphere'] = {
    init: function() {
      this.appendValueInput("NAME")
          .setCheck("Number")
          .appendField("Make Sphere with")
          .appendField("diameter:")
          .appendField(new Blockly.FieldDropdown([["small","small"], ["medium","medium"], ["large","large"]]), "NAME");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
   this.setTooltip("");
   this.setHelpUrl("");
    }
  };

// Blockly.JavaScript['create_sphere'] = function(block) {
// var dropdown_name = block.getFieldValue('NAME');
// var value_name = Blockly.JavaScript.valueToCode(block, 'NAME', Blockly.JavaScript.ORDER_ATOMIC);
// // TODO: Assemble JavaScript into code variable.
// var code = 'alert("' + dropdown_name + '")';
// return code;
// };