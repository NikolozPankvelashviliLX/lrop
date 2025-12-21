sap.ui.define(
  [
    "sap/ui/test/Opa5",
    "./Common",
    "sap/ui/test/actions/Press",
    "sap/ui/test/matchers/Properties",
  ],
  (Opa5, Common, Press, Properties) => {
    "use strict";

    var sViewName = "ObjectPage";

    Opa5.createPageObjects({
      onTheObjectPage: {
        baseClass: Common,
        actions: {
          iPressTheBackButton: function () {
            return this.waitFor({
              controlType: "sap.m.Link",
              viewName: sViewName,
              matchers: new Properties({
                text: "List Report",
              }),
              actions: new Press(),
              errorMessage: "Did not find the Back link",
            });
          },
        },
        assertions: {
          iShouldSeeTheTitle: function (sTitle) {
            return this.waitFor({
              controlType: "sap.m.Title",
              viewName: sViewName,
              matchers: new Properties({
                text: sTitle,
              }),
              success: () => {
                Opa5.assert.ok(
                  true,
                  "The Object Page title is correct: " + sTitle
                );
              },
              errorMessage: "Did not find the title " + sTitle,
            });
          },
        },
      },
    });
  }
);
