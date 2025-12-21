/*global  sinon*/
sap.ui.define(
  ["npproj1/controller/ObjectPage.controller"],
  (ObjectPageController) => {
    "use strict";

    QUnit.module("ObjectPage Controller Logic", {
      beforeEach: function () {
        this.oController = new ObjectPageController();
      },
      afterEach: function () {
        this.oController.destroy();
      },
    });

    QUnit.test(
      "Should enable buttons when items are selected",
      function (assert) {
        // Arrange
        var oBtnEdit = { setEnabled: sinon.spy() };
        var oBtnDelete = { setEnabled: sinon.spy() };

        var oStubById = sinon.stub(this.oController, "byId");
        oStubById.withArgs("btnEditProduct").returns(oBtnEdit);
        oStubById.withArgs("btnDeleteProduct").returns(oBtnDelete);

        // Create a fake table event that says "2 items selected"
        var oFakeTable = {
          getSelectedItems: sinon.stub().returns([{}, {}]),
        };
        var oEvent = {
          getSource: sinon.stub().returns(oFakeTable),
        };

        // Act
        this.oController.onProductSelectionChange(oEvent);

        // Assert
        assert.ok(oBtnEdit.setEnabled.calledWith(true), "Edit button enabled");
        assert.ok(
          oBtnDelete.setEnabled.calledWith(true),
          "Delete button enabled"
        );

        oStubById.restore();
      }
    );

    QUnit.test(
      "Should disable buttons when selection is empty",
      function (assert) {
        // Arrange
        var oBtnEdit = { setEnabled: sinon.spy() };
        var oBtnDelete = { setEnabled: sinon.spy() };

        var oStubById = sinon.stub(this.oController, "byId");
        oStubById.withArgs("btnEditProduct").returns(oBtnEdit);
        oStubById.withArgs("btnDeleteProduct").returns(oBtnDelete);

        var oFakeTable = {
          getSelectedItems: sinon.stub().returns([]),
        };
        var oEvent = { getSource: sinon.stub().returns(oFakeTable) };

        // Act
        this.oController.onProductSelectionChange(oEvent);

        // Assert
        assert.ok(
          oBtnEdit.setEnabled.calledWith(false),
          "Edit button disabled"
        );

        oStubById.restore();
      }
    );
  }
);
