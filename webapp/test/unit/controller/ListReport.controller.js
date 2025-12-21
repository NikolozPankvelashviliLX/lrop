/*global sinon*/
sap.ui.define(
  [
    "npproj1/controller/ListReport.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/FilterOperator",
  ],
  (ListReportController, JSONModel, FilterOperator) => {
    "use strict";

    QUnit.module("ListReport Controller Logic", {
      beforeEach: function () {
        this.oController = new ListReportController();

        this.oAppStateModel = new JSONModel({ tableTitle: "" });

        this.oStubGetModel = sinon.stub(this.oController, "getModel");
        this.oStubGetModel.withArgs("appState").returns(this.oAppStateModel);
      },
      afterEach: function () {
        this.oController.destroy();
        this.oStubGetModel.restore();
      },
    });

    QUnit.test("Should set title for 0 items", function (assert) {
      // Arrange
      var oFakeEvent = {
        getParameter: sinon.stub().withArgs("actual").returns(0),
      };
      this.oController.i18n = sinon.stub().returns("No Items Found");

      // Act
      this.oController._onTableUpdateFinished(oFakeEvent);

      // Assert
      assert.strictEqual(
        this.oAppStateModel.getProperty("/tableTitle"),
        "No Items Found"
      );
      assert.ok(
        this.oController.i18n.calledWith("tableTitleNoItems"),
        "Called correct i18n key"
      );
    });

    QUnit.test("Should set title for 1 item", function (assert) {
      // Arrange
      var oFakeEvent = {
        getParameter: sinon.stub().withArgs("actual").returns(1),
      };
      this.oController.i18n = sinon.stub().returns("1 Item");

      // Act
      this.oController._onTableUpdateFinished(oFakeEvent);

      // Assert
      assert.strictEqual(
        this.oAppStateModel.getProperty("/tableTitle"),
        "1 Item"
      );
    });

    QUnit.test("Should build filters from valid tokens", function (assert) {
      // Arrange
      var sPath = "FloorArea";
      var oToken1 = {
        data: sinon
          .stub()
          .withArgs("range")
          .returns({ operation: FilterOperator.BT, value1: 10, value2: 20 }),
      };
      var oMultiInput = {
        getTokens: sinon.stub().returns([oToken1]),
      };

      // Act
      var aResult = this.oController._getFiltersFromMultiInput(
        oMultiInput,
        sPath
      );

      // Assert
      assert.strictEqual(aResult.length, 1, "Returned 1 filter");
      assert.strictEqual(
        aResult[0].sPath,
        "FloorArea",
        "Filter path is correct"
      );
      assert.strictEqual(
        aResult[0].sOperator,
        FilterOperator.BT,
        "Operator is correct"
      );
    });
  }
);
