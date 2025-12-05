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
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/model/type/Float",
    "sap/ui/model/type/String",
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
    Messaging,
    ValueHelpDialog,
    Float,
    String
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
       * Stores a reference to the generic Value Help Dialog.
       * Used to manage the dialog instance when switching between different filter types.
       * @private
       * @type {sap.ui.comp.valuehelpdialog.ValueHelpDialog | null}
       */
      _oValueHelpDialog: null,

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

        this.getView().setModel(
          sap.ui.getCore().getMessageManager().getMessageModel(),
          "message"
        );
        Messaging.registerObject(this.getView(), true);
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
       * Opens the Value Help Dialog in "Conditions Only" mode.
       * @param {sap.ui.base.Event} oEvent
       */
      onValueHelpRequest(oEvent) {
        const oMultiInput = oEvent.getSource();

        const sPath = oMultiInput.data("propertyPath");
        const sType = oMultiInput.data("filterType");

        const sLabel = oMultiInput.getParent().getLabel();

        let oTypeInstance;

        if (sType === "number") {
          oTypeInstance = new Float();
        } else if (sType === "string") {
          oTypeInstance = new String();
        }

        if (this._oValueHelpDialog) {
          this._oValueHelpDialog.destroy();
        }

        this._oValueHelpDialog = new ValueHelpDialog({
          title: sLabel,
          supportRanges: true,
          supportRangesOnly: true,
          key: sPath,
          descriptionKey: sPath,

          ok: (oDialogEvent) => {
            const aTokens = oDialogEvent.getParameter("tokens");
            oMultiInput.setTokens(aTokens);
            this._oValueHelpDialog.close();
          },
          cancel: () => {
            this._oValueHelpDialog.close();
          },
        });

        this._oValueHelpDialog.setRangeKeyFields([
          {
            label: sLabel,
            key: sPath,
            type: sType,
            typeInstance: oTypeInstance,
          },
        ]);

        this._oValueHelpDialog.setTokens(oMultiInput.getTokens());
        this._oValueHelpDialog.open();
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
        const aFinalFilters = [];
        let iFilterCount = 0;

        const oFilterBar = this.byId("filterbar");
        const aFilterItems = oFilterBar.getFilterGroupItems();

        aFilterItems.forEach((oItem) => {
          const oControl = oItem.getControl();

          // A. Handle MultiInputs (Generic)
          // We check if it is a MultiInput and has the customData we expect
          if (
            oControl.isA("sap.m.MultiInput") &&
            oControl.data("propertyPath")
          ) {
            const sPath = oControl.data("propertyPath");
            const aTokens = oControl.getTokens();

            if (aTokens.length > 0) {
              const aFilters = this._getFiltersFromMultiInput(oControl, sPath);
              if (aFilters.length > 0) {
                aFinalFilters.push(
                  new Filter({
                    filters: aFilters,
                    and: false,
                  })
                );
                iFilterCount += aTokens.length;
              }
            }
          }

          // B. Handle DatePicker
          if (oControl.isA("sap.m.DatePicker") && oControl.getDateValue()) {
            const oDateValue = oControl.getDateValue();
            const oDateEnd = new Date(oDateValue);
            oDateEnd.setHours(23, 59, 59, 999);

            aFinalFilters.push(
              new Filter({
                path: "Established",
                operator: FilterOperator.BT,
                value1: oDateValue,
                value2: oDateEnd,
              })
            );
            iFilterCount++;
          }
        });

        let sMsg =
          iFilterCount === 0
            ? this.i18n("noActiveFilters")
            : this.i18n("filtersAppliedPlural", [iFilterCount]);
        oViewModel.setProperty("/filterMessage", sMsg);

        const oTable = this._getStoresTable();
        const oBinding = oTable.getBinding("items");

        if (aFinalFilters.length > 0) {
          oBinding.filter(new Filter({ filters: aFinalFilters, and: true }));
        } else {
          oBinding.filter([]);
        }
      },

      /**
       * Helper method to convert MultiInput tokens (from ValueHelpDialog) into an array of OData Filters.
       * It extracts the 'range' custom data from each token to build the corresponding filter operation.
       *
       * @param {sap.m.MultiInput} oMultiInput - The MultiInput control instance containing the tokens.
       * @param {string} sPath - The OData property path (e.g., "Name", "FloorArea") to apply the filter to.
       * @returns {sap.ui.model.Filter[]} An array of filter objects ready to be applied to the binding.
       * @private
       */
      _getFiltersFromMultiInput(oMultiInput, sPath) {
        const aTokens = oMultiInput.getTokens();
        const aFilters = [];

        aTokens.forEach(function (oToken) {
          const oRangeData = oToken.data("range");
          if (oRangeData) {
            aFilters.push(
              new Filter({
                path: sPath,
                operator: oRangeData.operation,
                value1: oRangeData.value1,
                value2: oRangeData.value2,
                caseSensitive: false,
              })
            );
          }
        });
        return aFilters;
      },

      /**
       * Event handler for the "Delete" button press.
       * Checks for selected items and shows a confirmation dialog.
       * @public
       */
      onDelete() {
        const oTable = this._getStoresTable();
        const aSelectedItems = oTable.getSelectedItems();
        const deleteCount = aSelectedItems.length;

        let sMessage = "";

        if (deleteCount === 1) {
          sMessage = this.i18n("confirmDeleteStoreSingluar", [
            aSelectedItems[0].getBindingContext().getProperty("Name"),
          ]);
        } else {
          sMessage = this.i18n("confirmDeleteStoresPlural", [deleteCount]);
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
       * Validates an input field on change.
       * @param {sap.ui.base.Event} oEvent - The event object
       * @public
       */
      onValidateInput: function (oEvent) {
        var oInput = oEvent.getSource();
        var sErrorMessage;
        var bDateValid = true;

        // 1. Special Handling for DatePicker
        // The 'change' event of DatePicker provides a 'valid' parameter.
        if (oInput.isA("sap.m.DatePicker")) {
          bDateValid = oEvent.getParameter("valid");
          if (!bDateValid) {
            // You can add "fieldInvalidDate" to your i18n file or use a hardcoded string
            sErrorMessage =
              this.i18n("fieldInvalidDate") || "Please enter a valid date";
          }
        }

        // 2. Standard Required Check
        // If the date was valid (format-wise), but is empty and required:
        if (!sErrorMessage && oInput.getRequired && oInput.getRequired()) {
          var sValue = oInput.getValue();
          if (!sValue) {
            sErrorMessage = this.i18n("fieldRequiredMessage");
          }
        }

        // 3. Number Validation (Your existing logic)
        if (!sErrorMessage && oInput.getType && oInput.getType() === "Number") {
          var sValue = oInput.getValue();
          if (isNaN(parseFloat(sValue)) || parseFloat(sValue) <= 0) {
            sErrorMessage = this.i18n("fieldMustBePositiveNumber");
          }
        }

        // 4. Set the State
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
