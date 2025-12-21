QUnit.config.autostart = false;

sap.ui.getCore().attachInit(() => {
  "use strict";

  sap.ui.require(["npproj1/test/integration/AllJourneys"], () => {
    QUnit.start();
  });
});
