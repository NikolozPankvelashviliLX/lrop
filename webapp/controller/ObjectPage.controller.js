sap.ui.define(
  [
    "npproj1/controller/BaseController",
    "npproj1/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  ],
  (
    BaseController,
    Formatter,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    Fragment
  ) => {
    "use strict";

    return BaseController.extend("npproj1.controller.ObjectPage", {
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
        const oRouter = this.getRouter();
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

        const oModel = this.getModel();

        const sKey = oModel.createKey("/Stores", {
          ID: sStoreID,
        });

        this.getView().bindElement({
          path: sKey,
        });
      },

      /**
       * Event handler for the product table's search field.
       * Filters the product list based on the search value across all columns with a 'path' custom data attribute.
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

        const aColumns = oTable.getColumns();
        aColumns.forEach((oColumn) => {
          const sPath = oColumn.data("path");

          if (sPath) {
            // Special handling for Price_amount because it is of type Edm.Decimal
            if (sPath === "Price_amount") {
              if (!isNaN(sSearchValue)) {
                aFilters.push(
                  new Filter({
                    path: sPath,
                    operator: FilterOperator.EQ,
                    value1: sSearchValue,
                  })
                );
              }
            } else {
              aFilters.push(
                new Filter({
                  path: sPath,
                  operator: FilterOperator.Contains,
                  value1: sSearchValue,
                  caseSensitive: false,
                })
              );
            }
          }
        });

        oBinding.filter(
          new Filter({
            filters: aFilters,
            and: false,
          })
        );
      },

      /**
       * Event handler for the global "Delete" button (Delete Store).
       * asks for confirmation, deletes the store, and navigates back to List Report.
       * @public
       */
      onDeleteStore() {
        const oView = this.getView();
        const oContext = oView.getBindingContext();

        if (!oContext) {
          return;
        }

        const sStoreName = oContext.getProperty("Name");

        MessageBox.warning(
          this.i18n("confirmDeleteStoreSingluar", [sStoreName]),
          {
            actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.DELETE,
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.DELETE) {
                this._deleteStore(oContext.getPath(), sStoreName);
              }
            },
          }
        );
      },

      /**
       * Internal helper to execute the delete request.
       * @param {string} sPath - The path of the store to delete
       * @private
       */
      _deleteStore(sPath, sStoreName) {
        const oModel = this.getModel();
        const oView = this.getView();

        oView.setBusy(true);

        oModel.remove(sPath, {
          success: () => {
            oView.setBusy(false);
            MessageToast.show(
              this.i18n("deleteStoreSuccessSingular", [sStoreName])
            );

            this.getRouter().navTo("RouteListReport");
          },
          error: () => {
            oView.setBusy(false);
            MessageBox.error(this.i18n("deleteErrorMessage"));
          },
        });
      },

      /**
       * Event handler for the "Delete" button press on a product item.
       * Shows a confirmation dialog before deleting the product.
       * @param {sap.ui.base.Event} oEvent - The press event object.
       * @public
       */
      onDeletePress(oEvent) {
        const oSource = oEvent.getSource();
        const oBindingContext = oSource.getBindingContext();
        const oModel = oBindingContext.getModel();
        const sDeletePath = oBindingContext.getPath();
        const oTable = this.byId("productsTable");

        MessageBox.warning(
          this.i18n("cofirmDeleteProductMessage", [
            oBindingContext.getProperty("Name"),
          ]),
          {
            actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.DELETE,
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.DELETE) {
                oTable.setBusy(true);
                oModel.remove(sDeletePath, {
                  success: () => {
                    MessageToast.show(this.i18n("productDeletedMessage"));
                  },
                  error: () => {
                    MessageBox.error(this.i18n("productDeleteErrorMessage"));
                  },
                });
                oTable.setBusy(false);
              }
            },
          }
        );
      },

      /**
       * Event handler for the "Edit" button press on a product item.
       * Lazily loads and opens the "EditProductDialog" fragment.
       * Binds the dialog to the context of the product to be edited.
       * @param {sap.ui.base.Event} oEvent - The press event object.
       * @public
       */
      async onEditPress(oEvent) {
        const oView = this.getView();
        const oSource = oEvent.getSource();
        const sPath = oSource.getBindingContext().getPath();
        const oTable = this.byId("productsTable");

        if (!this._oEditProductDialog) {
          oTable.setBusy(true);
          const oDialog = await Fragment.load({
            id: oView.getId(),
            name: "npproj1.view.EditProductDialog",
            controller: this,
          });

          this._oEditProductDialog = oDialog;
          oView.addDependent(this._oEditProductDialog);
          oTable.setBusy(false);
        }

        this._oEditProductDialog.bindElement(sPath);
        this._oEditProductDialog.open();
      },

      /**
       * Event handler for the "Save" button in the edit product dialog.
       * Submits the pending changes in the OData model.
       * @public
       */
      onSaveEdit() {
        const oModel = this.getModel();

        this._oEditProductDialog.setBusy(true);

        oModel.submitChanges({
          success: () => {
            this._oEditProductDialog.close();
            MessageToast.show(this.i18n("productUpdatedMessage"));
          },
          error: () => {
            MessageBox.error(this.i18n("errorUpdatingProductMessage"));
          },
        });
        this._oEditProductDialog.setBusy(false);
      },

      /**
       * Event handler for the "Cancel" button in the edit product dialog.
       * Resets the changes made to the OData model for the specific product
       * and closes the dialog.
       * @public
       */
      onCancelEdit() {
        const oModel = this.getModel();
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
        const oRouter = this.getRouter();
        oRouter.navTo("RouteListReport");
      },
    });
  }
);
