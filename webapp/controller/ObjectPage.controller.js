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
      /**
       * A reference to the formatter module.
       * @public
       */
      formatter: Formatter,

      /**
       * Stores a reference to the "Edit Product" dialog.
       * @private
       * @type {sap.m.Dialog | null}
       */
      _oEditProductDialog: null,

      /**
       * Called when the controller is instantiated.
       * Attaches a listener to the "RouteObjectPage" route.
       * @public
       * @override
       */
      onInit() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("RouteObjectPage")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      /**
       * Callback function for when the "RouteObjectPage" route is matched.
       * Binds the view to the specific store item based on the "StoreID" from the URL.
       * @param {sap.ui.base.Event} oEvent - The route matched event.
       * @private
       */
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

      /**
       * Event handler for the product table's search field.
       * Filters the product list based on the search value across multiple fields (Name, Specs, SupplierInfo).
       * The filter is case-insensitive and uses an OR condition.
       * @param {sap.ui.base.Event} oEvent - The search event object.
       * @public
       */
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

      /**
       * Event handler for the "Delete" button press on a product item.
       * Shows a confirmation dialog before deleting the product.
       * @param {sap.ui.base.Event} oEvent - The press event object.
       * @public
       */
      onDeletePress(oEvenet) {
        const oSource = oEvenet.getSource();
        const oBindingContext = oSource.getBindingContext();
        const oModel = oBindingContext.getModel();
        const sDeletePath = oBindingContext.getPath();
        const oBundle = this.getView().getModel("i18n").getResourceBundle();

        MessageBox.warning(oBundle.getText("cofirmDeleteProductMessage"), {
          actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.DELETE,
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.DELETE) {
              oModel.remove(sDeletePath, {
                success: () => {
                  MessageToast.show(oBundle.getText("productDeletedMessage"));
                },
                error: () => {
                  MessageBox.error(
                    oBundle.getText("productDeleteErrorMessage")
                  );
                },
              });
            }
          },
        });
      },

      /**
       * Event handler for the "Edit" button press on a product item.
       * Lazily loads and opens the "EditProductDialog" fragment.
       * Binds the dialog to the context of the product to be edited.
       * @param {sap.ui.base.Event} oEvent - The press event object.
       * @public
       */
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

      /**
       * Event handler for the "Save" button in the edit product dialog.
       * Submits the pending changes in the OData model.
       * @public
       */
      onSaveEdit() {
        const oModel = this.getView().getModel();

        const oBundle = this.getView().getModel("i18n").getResourceBundle();

        this._oEditProductDialog.setBusy(true);

        oModel.submitChanges({
          success: () => {
            this._oEditProductDialog.setBusy(false);
            this._oEditProductDialog.close();
            MessageToast.show(oBundle);
          },
          error: () => {
            this._oEditProductDialog.setBusy(false);
            MessageBox.error(oBundle.getText("productEditErrorMessage"));
          },
        });
      },

      /**
       * Event handler for the "Cancel" button in the edit product dialog.
       * Resets the changes made to the OData model for the specific product
       * and closes the dialog.
       * @public
       */
      onCancelEdit() {
        const oModel = this.getView().getModel();
        const sPath = this._oEditProductDialog.getBindingContext().getPath();

        oModel.resetChanges([sPath]);

        this._oEditProductDialog.close();
      },

      /**
       * Event handler for the "Back" button press.
       * Navigates back to the List Report page.
       * @public
       */
      onNavBack() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("RouteListReport");
      },
    });
  }
);
