/*global QUnit, sinon*/
sap.ui.define(
  [
    "npproj1/controller/BaseController",
    "sap/ui/core/UIComponent",
    "sap/ui/core/mvc/Controller",
  ],
  function (BaseController, UIComponent, Controller) {
    "use strict";

    QUnit.module("BaseController", {
      beforeEach: function () {
        this.oBaseController = new BaseController();

        this.oViewStub = {
          getModel: sinon.stub(),
          setModel: sinon.stub(),
        };

        this.oGetViewStub = sinon
          .stub(this.oBaseController, "getView")
          .returns(this.oViewStub);
      },
      afterEach: function () {
        this.oBaseController.destroy();
        this.oGetViewStub.restore();
      },
    });

    QUnit.test("Should call getModel on the View", function (assert) {
      // Arrange
      var oExpectedModel = { foo: "bar" };
      this.oViewStub.getModel.withArgs("i18n").returns(oExpectedModel);

      // Act
      var oResult = this.oBaseController.getModel("i18n");

      // Assert
      assert.strictEqual(
        oResult,
        oExpectedModel,
        "The controller returned the model from the view"
      );
      assert.ok(
        this.oViewStub.getModel.calledWith("i18n"),
        "The view's getModel function was called with correct arguments"
      );
    });

    QUnit.test("Should call setModel on the View", function (assert) {
      // Arrange
      var oModel = { someData: true };
      var sName = "myModel";

      // Act
      this.oBaseController.setModel(oModel, sName);

      // Assert
      assert.ok(
        this.oViewStub.setModel.calledWith(oModel, sName),
        "The view's setModel was called with the correct model and name"
      );
    });

    QUnit.test("Should access the Router via UIComponent", function (assert) {
      // Arrange
      var oRouterStub = {};

      var oUICompStub = sinon
        .stub(UIComponent, "getRouterFor")
        .returns(oRouterStub);

      // Act
      var oResult = this.oBaseController.getRouter();

      // Assert
      assert.strictEqual(oResult, oRouterStub, "The router was returned");

      oUICompStub.restore();
    });

    QUnit.test("Should return translated text", function (assert) {
      // Arrange:
      var oResourceBundleStub = {
        getText: sinon.stub().withArgs("myKey").returns("Translated Value"),
      };

      var oModelStub = {
        getResourceBundle: sinon.stub().returns(oResourceBundleStub),
      };

      this.oViewStub.getModel.withArgs("i18n").returns(oModelStub);

      // Act
      var sResult = this.oBaseController.i18n("myKey");

      // Assert
      assert.strictEqual(sResult, "Translated Value", "Correct text returned");
    });
  }
);
