sap.ui.define(
  ["sap/ui/core/mvc/Controller", "npproj1/model/formatter"],
  (Controller, Formatter) => {
    "use strict";

    return Controller.extend("npproj1.controller.ObjectPage", {
      formatter: Formatter,

      onInit() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("RouteObjectPage")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched(oEvent) {
        const sStoreID = oEvent.getParameter("arguments").StoreID;

        const oModel = this.getView().getModel();

        const sKey = oModel.createKey("/Stores", {
          ID: sStoreID,
        });

        this.getView().bindElement({
          path: sKey,
        });
      },

      onNavBack() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("RouteListReport");
      },
    });
  }
);
