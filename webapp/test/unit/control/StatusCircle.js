/*global QUnit*/
sap.ui.define(["npproj1/control/StatusCircle"], function (StatusCircle) {
  "use strict";

  QUnit.module("StatusCircle Control");

  QUnit.test(
    "Should match the status property to the CSS class",
    function (assert) {
      // 1. Arrange
      var oControl = new StatusCircle({
        status: "Success",
      });

      // 2. Act & 3. Assert
      assert.strictEqual(
        oControl.getStatus(),
        "Success",
        "Property 'status' is set to Success"
      );

      // Cleanup
      oControl.destroy();
    }
  );

  QUnit.test("Should default to None status", function (assert) {
    var oControl = new StatusCircle();
    assert.strictEqual(oControl.getStatus(), "None", "Default status is None");
    oControl.destroy();
  });
});
