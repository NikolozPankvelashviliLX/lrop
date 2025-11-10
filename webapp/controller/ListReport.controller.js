sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
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
    Controller,
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

    return Controller.extend("npproj1.controller.ListReport", {
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
      onInit() {},

      /**
       * Event handler for the filter bar's search event.
       * Gathers values from the search field and date picker,
       * creates filters, and applies them to the table binding.
       * @public
       */
      onFilterBarSearch() {
        const sSearchValue = this.byId("searchField").getValue();
        const oDateValue = this.byId("datePicker").getDateValue();

        const aFilters = [];

        if (sSearchValue) {
          aFilters.push(
            new Filter({
              path: "Name",
              operator: FilterOperator.Contains,
              value1: sSearchValue,
            })
          );
        }

        if (oDateValue) {
          const oDateEnd = new Date(oDateValue);
          oDateEnd.setHours(23, 59, 59, 999);

          aFilters.push(
            new Filter({
              path: "Established",
              operator: FilterOperator.BT,
              value1: oDateValue,
              value2: oDateEnd,
            })
          );
        }

        const oTable = this.byId("storesTable");
        const oBinding = oTable.getBinding("items");

        oBinding.filter(
          new Filter({
            filters: aFilters,
            and: true,
          })
        );
      },

      /**
       * Event handler for the "Delete" button press.
       * Checks for selected items and shows a confirmation dialog.
       * @public
       */
      onDelete() {
        const oTable = this.byId("storesTable");
        const aSelectedItems = oTable.getSelectedItems();

        if (aSelectedItems.length === 0) {
          MessageToast.show("Please select at least one item to delete.");
          return;
        }

        const sMessage = `Are you sure you want to delete ${aSelectedItems.length} item(s)?`;

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
        const oModel = this.getView().getModel();

        oModel.setUseBatch(true);

        aItems.forEach((oItem) => {
          const sPath = oItem.getBindingContext().getPath();
          oModel.remove(sPath, { batchGroupId: "deleteGroup" });
        });

        oModel.submitChanges({
          success: () => {
            MessageToast.show("Item(s) deleted successfully.");
          },
          error: () => {
            MessageBox.error("An error occurred while deleting the items.");
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
      onCreate() {
        const oView = this.getView();

        const oNewStoreModel = new JSONModel({
          Name: "",
          FloorArea: null,
          Established: null,
        });

        if (!this._oCreateDialog) {
          Fragment.load({
            id: oView.getId(),
            name: "npproj1.view.CreateDialog",
            controller: this,
          }).then((oDialog) => {
            this._oCreateDialog = oDialog;
            oView.addDependent(this._oCreateDialog);
            this._oCreateDialog.setModel(oNewStoreModel, "newStore");
            this._oCreateDialog.open();
          });
        } else {
          this._oCreateDialog.setModel(oNewStoreModel, "newStore");
          this._oCreateDialog.open();
        }
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
        const oModel = this.getView().getModel();
        const oNewStoreData = this._oCreateDialog
          .getModel("newStore")
          .getData();

        if (
          !oNewStoreData.Name ||
          !oNewStoreData.FloorArea ||
          !oNewStoreData.Established
        ) {
          MessageToast.show("Please fill all required fields.");
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
            MessageToast.show("Store created successfully.");
            this._oCreateDialog.close();
          },
          error: () => {
            MessageBox.error("An error occurred while creating the store.");
          },
        });
      },

      /**
       * Event handler for the "Sort" button press.
       * Lazily loads and opens the "SortDialog" (ViewSettingsDialog) fragment.
       * @public
       */
      onSort() {
        const oView = this.getView();

        if (!this._oSortDialog) {
          Fragment.load({
            id: oView.getId(),
            name: "npproj1.view.SortDialog",
            controller: this,
          }).then((oDialog) => {
            this._oSortDialog = oDialog;
            oView.addDependent(this._oSortDialog);
            this._oSortDialog.open();
          });
        } else {
          this._oSortDialog.open();
        }
      },

      /**
       * Event handler for the "confirm" event of the sort dialog.
       * Applies the selected sorting criteria to the table binding.
       * @param {sap.ui.base.Event} oEvent - The event object from the sort dialog.
       * @public
       */
      onSortConfirm(oEvent) {
        const oTable = this.byId("storesTable");
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
        const oTable = this.byId("storesTable");
        const oBinding = oTable.getBinding("items");

        oBinding.sort([]);

        // This does not work, I don't know why
        this._oSortDialog.close();
      },

      onListItemPress(oEvent) {
        const oModel = this.getView().getModel();
        const oItem = oEvent.getSource();
        const sStoreId = oItem.getBindingContext().getProperty("ID");

        // Can we use this somehow here to improve navigation?
        const key = oModel.createKey("/Stores", { ID: sStoreId });

        this.getOwnerComponent().getRouter().navTo("RouteObjectPage", {
          StoreID: sStoreId,
        });
      },
    });
  }
);
