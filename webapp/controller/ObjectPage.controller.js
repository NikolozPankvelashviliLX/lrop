sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "npproj1/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  (Controller, Formatter, Filter, FilterOperator, MessageBox, MessageToast) => {
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

      onProductSearch(oEvent) {
        const sSearchValue = oEvent.getParameter("query");
        const oTable = this.byId("productsTable");
        const oBinding = oTable.getBinding("items");

        const aFilters = [];

        if (!sSearchValue) {
          oBinding.filter([]);
          return;
        }

        // Without "SupplierInfo" field, with the SAME code, if I filtered some data with value "ver"
        // I would end up with more products... I do not know why...

        ["Name", "Specs", "SupplierInfo"].forEach((sField) => {
          aFilters.push(
            new Filter({
              path: sField,
              operator: FilterOperator.Contains,
              value1: sSearchValue,
              caseSensitive: false,
            })
          );
        });

        oBinding.filter(
          new Filter({
            filters: aFilters,
            and: false,
          })
        );
      },

      onDeletePress(oEvenet) {
        const oSource = oEvenet.getSource();
        const oBindingContext = oSource.getBindingContext();
        const oModel = oBindingContext.getModel();
        const sDeletePath = oBindingContext.getPath();

        MessageBox.warning("Are you sure you want to delete this product?", {
          actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.DELETE,
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.DELETE) {
              oModel.remove(sDeletePath, {
                success: () => {
                  MessageToast.show("Product deleted successfully.");
                },
                error: () => {
                  MessageBox.error("Failed to delete the product.");
                },
              });
            }
          },
        });
      },

      onNavBack() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("RouteListReport");
      },
    });
  }
);
