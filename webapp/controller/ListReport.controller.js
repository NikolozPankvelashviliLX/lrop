sap.ui.define(
  [
    "npproj1/controller/BaseController",
    "npproj1/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
  ],
  (
    BaseController,
    Formatter,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    Fragment,
    JSONModel,
    Sorter
  ) => {
    "use strict";

    return BaseController.extend("npproj1.controller.ListReport", {
      /**
       * A reference to the formatter module.
       * @public
       */
      formatter: Formatter,

      /**
       * Stores a reference to the "Create Store" dialog.
       * @private
       * @type {sap.m.Dialog | null}
       */
      _oCreateDialog: null,

      /**
       * Stores a reference to the "Sort" dialog.
       * @private
       * @type {sap.m.ViewSettingsDialog | null}
       */
      _oSortDialog: null,

      /**
       * Called when the controller is instantiated.
       * @public
       * @override
       */
      onInit() {
        const oViewModel = new JSONModel({
          deleteEnabled: false,
        });
        this.setModel(oViewModel, "appState");
      },

      _getStoresTable() {
        return this.byId("storesTable");
      },

      /**
       * Event handler for the selectionChange event of the table.
       * This function updates the "deleteEnabled" property in the view model
       * based on whether any items are currently selected in the table.
       *
       * @public
       */
      onSelectionChange() {
        const oTable = this._getStoresTable();
        const bHasSelection = oTable.getSelectedItems().length > 0;
        this.getModel("appState").setProperty("/deleteEnabled", bHasSelection);
      },

      /**
       * Event handler for the search field's search event.
       * Triggers the filter bar's search method.
       * @param {sap.ui.base.Event} oEvent - The search event
       * @public
       */
      onSearchFieldExecute: function (oEvent) {
        const oSearchField = oEvent.getSource();

        const oFilterBar = oSearchField.getParent();

        oFilterBar.search();
      },

      /**
       * Event handler for the filter bar's search event.
       * Gathers values from the search field and date picker,
       * creates filters, and applies them to the table binding.
       * @param {sap.ui.base.Event} oEvent - The search event
       * @public
       */
      onFilterBarSearch(oEvent) {
        let sSearchValue = "";
        const oFilterBar = oEvent.getSource();
        const sBasicSearchId = oFilterBar.getBasicSearch();
        if (sBasicSearchId) {
          const oBasicSearch = this.byId(sBasicSearchId);
          if (oBasicSearch) {
            sSearchValue = oBasicSearch.getValue();
          }
        }

        const aSelectionSet = oEvent.getParameter("selectionSet");

        const oDatePicker = aSelectionSet.find((oControl) =>
          oControl.isA("sap.m.DatePicker")
        );
        const oDateValue = oDatePicker ? oDatePicker.getDateValue() : null;

        const oTable = this._getStoresTable();
        const aColumns = oTable.getColumns();

        const aSearchFilters = [];
        const aDateFilters = [];

        aColumns.forEach((oColumn) => {
          const sPath = oColumn.data("path");

          if (!sPath) {
            return;
          }

          if (sPath === "Established") {
            if (oDateValue) {
              const oDateEnd = new Date(oDateValue);
              oDateEnd.setHours(23, 59, 59, 999);

              aDateFilters.push(
                new Filter({
                  path: sPath,
                  operator: FilterOperator.BT,
                  value1: oDateValue,
                  value2: oDateEnd,
                })
              );
            }
          } else {
            if (sSearchValue) {
              aSearchFilters.push(
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

        const aFinalFilters = [];

        if (aSearchFilters.length > 0) {
          aFinalFilters.push(
            new Filter({
              filters: aSearchFilters,
              and: false,
            })
          );
        }

        if (aDateFilters.length > 0) {
          aFinalFilters.push(...aDateFilters);
        }

        const oBinding = oTable.getBinding("items");

        if (aFinalFilters.length > 0) {
          oBinding.filter(
            new Filter({
              filters: aFinalFilters,
              and: true,
            })
          );
        } else {
          oBinding.filter([]);
        }
      },

      /**
       * Event handler for the "Delete" button press.
       * Checks for selected items and shows a confirmation dialog.
       * @public
       */
      onDelete() {
        const oTable = this._getStoresTable();
        const aSelectedItems = oTable.getSelectedItems();

        const sMessage = this.i18n("confirmDeleteMessage", [
          aSelectedItems.length,
        ]);

        MessageBox.warning(sMessage, {
          actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.DELETE,
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.DELETE) {
              this._performDelete(aSelectedItems);
            }
          },
        });
      },

      /**
       * Internal helper method to perform the deletion of items via OData batch request.
       * @param {sap.m.ListItemBase[]} aItems - An array of table items to be deleted.
       * @private
       */
      _performDelete(aItems) {
        const oModel = this.getModel();

        aItems.forEach((oItem) => {
          const sPath = oItem.getBindingContext().getPath();
          oModel.remove(sPath);
        });

        oModel.submitChanges({
          success: () => {
            MessageToast.show(
              this.i18n("deleteSuccessMessage", [aItems.length])
            );
          },
          error: () => {
            MessageBox.error(this.i18n("deleteErrorMessage"));
          },
        });

        this.byId("storesTable").removeSelections(true);
      },

      /**
       * Event handler for the "Create" button press.
       * Lazily loads and opens the "CreateDialog" fragment.
       * Initializes a JSONModel for the new store data.
       * @public
       */
      async onCreate() {
        const oView = this.getView();

        const oNewStoreModel = new JSONModel({
          Name: "",
          FloorArea: null,
          Established: null,
        });

        if (!this._oCreateDialog) {
          const oDialog = await Fragment.load({
            id: oView.getId(),
            name: "npproj1.view.CreateDialog",
            controller: this,
          });

          this._oCreateDialog = oDialog;
          oView.addDependent(this._oCreateDialog);
        }
        this._oCreateDialog.setModel(oNewStoreModel, "newStore");
        this._oCreateDialog.open();
      },

      /**
       * Event handler for the "Cancel" button in the create dialog.
       * Closes the create dialog.
       * @public
       */
      onCancelCreate() {
        this._oCreateDialog.close();
      },

      /**
       * Event handler for the "Save" button in the create dialog.
       * Validates input fields and sends a create request to the OData service.
       * @public
       */
      onSaveCreate() {
        const oModel = this.getModel();

        const oNewStoreData = this._oCreateDialog
          .getModel("newStore")
          .getData();

        if (
          !oNewStoreData.Name ||
          !oNewStoreData.FloorArea ||
          !oNewStoreData.Established
        ) {
          MessageToast.show(this.i18n("fillRequiredFieldsMessage"));
          return;
        }

        // Hardcoding some values since they are not important for now
        const oPayload = {
          Name: oNewStoreData.Name,
          FloorArea: oNewStoreData.FloorArea,
          Established: oNewStoreData.Established,
          Email: "email@gmail.com",
          PhoneNumber: "555-1234",
          Address: "123 Main St, City, Country",
        };

        oModel.create("/Stores", oPayload, {
          success: () => {
            MessageToast.show(this.i18n("storeCreatedMessage"));
            this._oCreateDialog.close();
          },
          error: () => {
            MessageBox.error(this.i18n("errorCreatingStoreMessage"));
          },
        });
      },

      /**
       * Event handler for the "Sort" button press.
       * Lazily loads and opens the "SortDialog" (ViewSettingsDialog) fragment.
       * @public
       */
      async onSort() {
        const oView = this.getView();

        if (!this._oSortDialog) {
          const oDialog = await Fragment.load({
            id: oView.getId(),
            name: "npproj1.view.SortDialog",
            controller: this,
          });

          this._oSortDialog = oDialog;
          oView.addDependent(this._oSortDialog);
        }

        this._oSortDialog.open();
      },

      /**
       * Event handler for the "confirm" event of the sort dialog.
       * Applies the selected sorting criteria to the table binding.
       * @param {sap.ui.base.Event} oEvent - The event object from the sort dialog.
       * @public
       */
      onSortConfirm(oEvent) {
        const oTable = this._getStoresTable();
        const oBinding = oTable.getBinding("items");

        const mParams = oEvent.getParameters();
        const sPath = mParams.sortItem.getKey();
        const bDescending = mParams.sortDescending;

        const oSorter = new Sorter(sPath, bDescending);
        oBinding.sort(oSorter);
      },

      /**
       * Event handler for the "reset" event of the sort dialog.
       * Resets the sorting on the table binding.
       * @public
       */
      onSortReset() {
        const oTable = this._getStoresTable();
        const oBinding = oTable.getBinding("items");

        oBinding.sort([]);
      },

      onListItemPress(oEvent) {
        const oItem = oEvent.getSource();
        const sStoreId = oItem.getBindingContext().getProperty("ID");

        this.getRouter().navTo("RouteObjectPage", {
          StoreID: sStoreId,
        });
      },
    });
  }
);
