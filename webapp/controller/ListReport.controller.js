sap.ui.define(
  ["sap/ui/core/mvc/Controller", "npproj1/model/formatter"],
  (Controller, Formatter) => {
    "use strict";

    return Controller.extend("npproj1.controller.ListReport", {
      formatter: Formatter,

      onInit() {},
    });
  }
);
