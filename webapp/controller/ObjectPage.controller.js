sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "npproj1/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  ],
  (
    Controller,
    Formatter,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    Fragment
  ) => {
    "use strict";

    return Controller.extend("npproj1.controller.ObjectPage", {
      formatter: Formatter,
      _oEditProductDialog: null,

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

      onEditPress(oEvent) {
        const oView = this.getView();
        const oSource = oEvent.getSource();
        const sPath = oSource.getBindingContext().getPath();

        if (!this._oEditProductDialog) {
          Fragment.load({
            id: oView.getId(),
            name: "npproj1.view.EditProductDialog",
            controller: this,
          }).then((oDialog) => {
            this._oEditProductDialog = oDialog;
            oView.addDependent(this._oEditProductDialog);
            this._oEditProductDialog.bindElement(sPath);
            this._oEditProductDialog.open();
          });
        } else {
          this._oEditProductDialog.bindElement(sPath);
          this._oEditProductDialog.open();
        }
      },

      onSaveEdit() {
        const oModel = this.getView().getModel();

        this._oEditProductDialog.setBusy(true);

        oModel.submitChanges({
          success: () => {
            this._oEditProductDialog.setBusy(false);
            this._oEditProductDialog.close();
            MessageToast.show("Product updated successfully.");
          },
          error: () => {
            this._oEditProductDialog.setBusy(false);
            MessageBox.error("Failed to update the product.");
          },
        });
      },

      onCancelEdit() {
        const oModel = this.getView().getModel();
        const sPath = this._oEditProductDialog.getBindingContext().getPath();

        oModel.resetChanges([sPath]);

        this._oEditProductDialog.close();
      },

      onNavBack() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("RouteListReport");
      },
    });
  }
);
