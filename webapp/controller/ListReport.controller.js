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
    "sap/ui/core/Messaging",
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
    Sorter,
    Messaging
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
          filterMessage: "",
          tableTitle: "",
        });
        this.setModel(oViewModel, "appState");

        this.setModel(
          sap.ui.getCore().getMessageManager().getMessageModel(),
          "message"
        );
        Messaging.registerObject(this.getView(), true);
      },

      /**
       * Convenience method to retrieve the main table control from the view.
       * @returns {sap.m.Table} The stores table control instance.
       * @private
       */
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
      onSearchFieldExecute(oEvent) {
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
        const oViewModel = this.getModel("appState");

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

        const aActiveFilters = [];

        if (sSearchValue) {
          aActiveFilters.push(this.i18n("search"));
        }
        if (oDateValue) {
          aActiveFilters.push(this.i18n("date"));
        }

        const iCount = aActiveFilters.length;
        let sMsg = "";

        if (iCount === 0) {
          sMsg = this.i18n("noActiveFilters");
        } else {
          const aDisplayList = aActiveFilters.slice(0, 5);
          let sListStr = aDisplayList.join(", ");

          if (iCount > 5) {
            sListStr += ", ...";
          }

          if (iCount === 1) {
            sMsg =
              this.i18n("filtersAppliedSingular", [iCount]) + " " + sListStr;
          } else {
            sMsg = this.i18n("filtersAppliedPlural", [iCount]) + " " + sListStr;
          }
        }

        oViewModel.setProperty("/filterMessage", sMsg);

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
        const iDeleteCount = aSelectedItems.length;

        let sMessage = "";

        if (iDeleteCount === 1) {
          sMessage = this.i18n("confirmDeleteStoreSingluar", [
            aSelectedItems[0].getBindingContext().getProperty("Name"),
          ]);
        } else {
          sMessage = this.i18n("confirmDeleteStoresPlural", [iDeleteCount]);
        }

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

        let sMessage = "";

        if (aItems.length === 1) {
          sMessage = this.i18n("deleteStoreSuccessSingular", [
            aItems[0].getBindingContext().getProperty("Name"),
          ]);
        } else {
          sMessage = this.i18n("deleteStoreSuccessPlural", [aItems.length]);
        }

        oModel.submitChanges({
          success: () => {
            MessageToast.show(sMessage);
          },
          error: () => {
            MessageBox.error(this.i18n("deleteErrorMessage"));
          },
        });

        this.getModel("appState").setProperty("/deleteEnabled", false);

        this._getStoresTable().removeSelections(true);
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
        this._clearFieldGroupState("createStoreGroup");
        this._oCreateDialog.close();
      },

      /**
       * Event handler for the "Save" button in the create dialog.
       * Validates input fields and sends a create request to the OData service.
       * @public
       */
      onSaveCreate() {
        if (!this._validateForm("createStoreGroup")) {
          MessageToast.show(this.i18n("fixErrorsInForm"));
          return;
        }

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
       * Validates an input field on live change or change.
       * @param {sap.ui.base.Event} oEvent - The event object
       * @public
       */
      onValidateInput(oEvent) {
        const oInput = oEvent.getSource();
        const sValue = oInput.getValue();
        let sErrorMessage;

        if (oInput.getRequired && oInput.getRequired() && !sValue) {
          sErrorMessage = this.i18n("fieldRequiredMessage");
        } else if (
          oInput.getType &&
          oInput.getType() === "Number" &&
          (isNaN(parseFloat(sValue)) || parseFloat(sValue) <= 0)
        ) {
          sErrorMessage = this.i18n("fieldMustBePositiveNumber");
        }

        if (sErrorMessage) {
          oInput.setValueState("Error");
          oInput.setValueStateText(sErrorMessage);
        } else {
          oInput.setValueState("None");
        }
      },

      /**
       * Validates all controls within a specific field group.
       * @param {string} sFieldGroupId - The ID of the field group to validate.
       * @returns {boolean} - true if all fields are valid, false otherwise.
       * @private
       */
      _validateForm(sFieldGroupId) {
        const oView = this.getView();
        let bValid = true;
        const aInputs = oView.getControlsByFieldGroupId(sFieldGroupId);

        aInputs.forEach((oInput) => {
          if (oInput.getValue && oInput.getValueState) {
            if (oInput.getValueState() === "Error") {
              bValid = false;
            } else if (
              oInput.getRequired &&
              oInput.getRequired() &&
              !oInput.getValue()
            ) {
              bValid = false;
              oInput.setValueState("Error");
              oInput.setValueStateText(this.i18n("fieldRequiredMessage"));
            } else if (
              oInput.getType &&
              oInput.getType() === "Number" &&
              (isNaN(parseFloat(oInput.getValue())) ||
                parseFloat(oInput.getValue()) <= 0)
            ) {
              bValid = false;
              oInput.setValueState("Error");
              oInput.setValueStateText(this.i18n("fieldMustBePositiveNumber"));
            } else if (oInput.setValueState) {
              oInput.setValueState("None");
            }
          }
        });

        return bValid;
      },

      /**
       * Clears the validation state for all controls in a field group.
       * @param {string} sFieldGroupId - The ID of the field group.
       * @private
       */
      _clearFieldGroupState(sFieldGroupId) {
        const aInputs = this.getView().getControlsByFieldGroupId(sFieldGroupId);
        aInputs.forEach((oInput) => {
          if (oInput.setValueState) {
            oInput.setValueState("None");
          }
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

      /**
       * Event handler for the table's 'updateFinished' event.
       * Updates the table title with the current item count.
       * @param {sap.ui.base.Event} oEvent - The event object.
       * @private
       */
      _onTableUpdateFinished: function (oEvent) {
        const iCount = oEvent.getParameter("actual");

        const oViewModel = this.getModel("appState");
        let sTitle = "";

        if (iCount === 0) {
          sTitle = this.i18n("tableTitleNoItems");
        } else if (iCount === 1) {
          sTitle = this.i18n("tableTitleSingular", [iCount]);
        } else {
          sTitle = this.i18n("tableTitlePlural", [iCount]);
        }

        oViewModel.setProperty("/tableTitle", sTitle);
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
