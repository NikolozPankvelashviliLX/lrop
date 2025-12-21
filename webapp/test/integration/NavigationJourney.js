sap.ui.define(
  ["sap/ui/test/opaQunit", "./pages/ListReport", "./pages/ObjectPage"],
  (opaTest) => {
    "use strict";

    var sNewStoreName = "OpaTest Store " + new Date().getTime();
    var sFloorArea = "5500";

    QUnit.module("E2E Navigation Journey");

    opaTest(
      "Should create a new product and verify data",
      (Given, When, Then) => {
        // 1. Start App
        Given.iStartMyApp();

        // 2. Create Product
        When.onTheListReport.iPressTheCreateButton();
        When.onTheListReport.iEnterStoreData(sNewStoreName, sFloorArea);
        When.onTheListReport.iPressSaveInDialog();

        // 3. Verify it appears
        Then.onTheListReport.iShouldSeeTheStoreInTheTable(sNewStoreName);

        // 4. Go to Object Page (Ensure data is same)
        When.onTheListReport.iClickOnTheStore(sNewStoreName);
        Then.onTheObjectPage.iShouldSeeTheTitle(sNewStoreName);
      }
    );

    opaTest("Should go back, search and delete", (Given, When, Then) => {
      // 5. Go Back
      When.onTheObjectPage.iPressTheBackButton();

      // 6. Search for the product to isolate it
      When.onTheListReport.iSearchFor(sNewStoreName);
      When.onTheListReport.iTriggerFilterBarSearch();

      // 7. Select and Delete
      When.onTheListReport.iSelectTheFirstItem();
      When.onTheListReport.iPressTheDeleteButton();
      When.onTheListReport.iConfirmTheDeleteDialog();

      // 8. Final check: Verify the item is gone
      Then.onTheListReport.iShouldNotSeeTheStoreInTheTable(sNewStoreName);

      // Cleanup
      Then.iTeardownMyApp();
    });
  }
);
