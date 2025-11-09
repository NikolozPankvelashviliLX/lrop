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
  ],
  (
    Controller,
    Formatter,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    Fragment,
    JSONModel
  ) => {
    "use strict";

    return Controller.extend("npproj1.controller.ListReport", {
      formatter: Formatter,
      _oCreateDialog: null,

      onInit() {},

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

      onCancelCreate() {
        this._oCreateDialog.close();
      },

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

      onListItemPress(oEvent) {
        const oModel = this.getView().getModel();
        const oItem = oEvent.getSource();
        const sStoreId = oItem.getBindingContext().getProperty("ID");

        // Can we use this somehow here to improve navigation?
        const key = oModel.createKey("/Stores", { ID: sStoreId });

        debugger;

        this.getOwnerComponent().getRouter().navTo("RouteObjectPage", {
          StoreID: sStoreId,
        });
      },
    });
  }
);
