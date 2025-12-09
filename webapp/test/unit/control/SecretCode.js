/*global QUnit*/
sap.ui.define(["npproj1/control/SecretCode"], function (SecretCode) {
  "use strict";

  QUnit.module("SecretCode Control");

  QUnit.test("Should toggle visibility on tap", function (assert) {
    var oControl = new SecretCode({
      text: "555-1234",
    });

    assert.strictEqual(oControl._bRevealed, false, "Initially hidden");

    oControl.ontap();

    assert.strictEqual(oControl._bRevealed, true, "Revealed after first click");

    oControl.ontap();

    assert.strictEqual(oControl._bRevealed, false, "Hidden after second click");

    oControl.destroy();
  });
});
