sap.ui.define(
  [
    "sap/ui/test/Opa5",
    "./Common",
    "sap/ui/test/actions/Press",
    "sap/ui/test/actions/EnterText",
    "sap/ui/test/matchers/Properties",
    "sap/ui/test/matchers/Ancestor",
    "sap/ui/core/format/DateFormat",
  ],
  function (Opa5, Common, Press, EnterText, Properties, Ancestor, DateFormat) {
    "use strict";

    var sViewName = "ListReport";

    Opa5.createPageObjects({
      onTheListReport: {
        baseClass: Common,
        actions: {
          iPressTheCreateButton: function () {
            return this.waitFor({
              controlType: "sap.m.Button",
              viewName: sViewName,
              matchers: new Properties({
                icon: "sap-icon://add",
              }),
              actions: new Press(),
              errorMessage: "Did not find the Create button",
            });
          },

          iEnterStoreData: function (sName, sArea) {
            // 1. Enter Name
            this.waitFor({
              id: "nameInput",
              viewName: sViewName,
              actions: new EnterText({ text: sName }),
              errorMessage: "Could not find name input",
            });

            // 2. Enter Floor Area
            this.waitFor({
              id: "floorAreaInput",
              viewName: sViewName,
              actions: new EnterText({ text: sArea }),
              errorMessage: "Could not find floor area input",
            });

            // 3. Enter Date
            return this.waitFor({
              id: "dateInput",
              viewName: sViewName,
              actions: function (oDatePicker) {
                var oDate = new Date("2023-01-01T12:00:00");
                var oFormat = DateFormat.getDateInstance({ style: "long" });
                var sDateText = oFormat.format(oDate);

                new EnterText({ text: sDateText }).executeOn(oDatePicker);
              },
              errorMessage: "Could not find date input",
            });
          },

          iPressSaveInDialog: function () {
            return this.waitFor({
              controlType: "sap.m.Button",
              matchers: new Properties({
                type: "Emphasized",
              }),
              actions: new Press(),
              errorMessage: "Could not find the Save button in the dialog",
            });
          },

          iClickOnTheStore: function (sName) {
            return this.waitFor({
              controlType: "sap.m.ColumnListItem",
              viewName: sViewName,
              matchers: function (oItem) {
                var oObjectIdentifier = oItem.getCells()[0];
                return (
                  oObjectIdentifier.getTitle() === sName ||
                  oObjectIdentifier.getText() === sName
                );
              },
              actions: new Press(),
              errorMessage: "Could not find the store " + sName,
            });
          },

          iSearchFor: function (sName) {
            return this.waitFor({
              controlType: "sap.m.MultiInput",
              viewName: sViewName,
              actions: [
                new EnterText({ text: sName }),
                function (oInput) {
                  oInput.fireSubmit();
                  var oFilterBar = oInput.getParent().getParent().getParent();
                  if (oFilterBar.search) {
                    oFilterBar.search();
                  }
                },
              ],
              errorMessage: "Could not find search field",
            });
          },

          iTriggerFilterBarSearch: function () {
            return this.waitFor({
              id: "filterbar",
              viewName: sViewName,
              success: function (oFilterBar) {
                oFilterBar.fireSearch();
              },
              errorMessage: "Could not trigger search",
            });
          },

          iSelectTheFirstItem: function () {
            return this.waitFor({
              id: "storesTable",
              viewName: sViewName,
              actions: function (oTable) {
                var aItems = oTable.getItems();
                if (aItems.length > 0) {
                  oTable.setSelectedItem(aItems[0]);
                  oTable.fireSelectionChange({ listItem: aItems[0] });
                }
              },
              errorMessage: "Could not select the first item",
            });
          },

          iPressTheDeleteButton: function () {
            return this.waitFor({
              controlType: "sap.m.Button",
              viewName: sViewName,
              matchers: new Properties({
                icon: "sap-icon://delete",
                enabled: true,
              }),
              actions: new Press(),
              errorMessage:
                "Did not find the Delete button (or it was disabled)",
            });
          },

          iConfirmTheDeleteDialog: function () {
            return this.waitFor({
              controlType: "sap.m.Button",
              matchers: new Properties({
                text: "Delete",
              }),
              actions: new Press(),
              errorMessage: "Did not find the Delete confirmation button",
            });
          },
        },

        assertions: {
          iShouldSeeTheStoreInTheTable: function (sName) {
            return this.waitFor({
              id: "storesTable",
              viewName: sViewName,
              matchers: function (oTable) {
                var aItems = oTable.getItems();
                return aItems.some(function (oItem) {
                  var oObjectIdentifier = oItem.getCells()[0];
                  return (
                    oObjectIdentifier.getTitle() === sName ||
                    oObjectIdentifier.getText() === sName
                  );
                });
              },
              success: function () {
                Opa5.assert.ok(
                  true,
                  "The store " + sName + " is displayed in the list"
                );
              },
              errorMessage: "The store was not found in the table",
            });
          },

          iShouldNotSeeTheStoreInTheTable: function (sName) {
            return this.waitFor({
              id: "storesTable",
              viewName: sViewName,
              check: function (oTable) {
                var aItems = oTable.getItems();
                var bFound = aItems.some(function (oItem) {
                  var oObjectIdentifier = oItem.getCells()[0];
                  return (
                    oObjectIdentifier.getTitle() === sName ||
                    oObjectIdentifier.getText() === sName
                  );
                });
                return !bFound;
              },
              success: function () {
                Opa5.assert.ok(
                  true,
                  "The store " + sName + " was successfully deleted"
                );
              },
              errorMessage:
                "The store is still displayed in the table (Delete failed)",
            });
          },
        },
      },
    });
  }
);
