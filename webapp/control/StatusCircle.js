sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("npproj1.control.StatusCircle", {
    metadata: {
      properties: {
        status: { type: "string", defaultValue: "None" },
        size: { type: "sap.ui.core.CSSSize", defaultValue: "1rem" },
      },
    },

    renderer: function (oRm, oControl) {
      var sStatus = oControl.getStatus();

      oRm.openStart("div", oControl);

      oRm.class("myStatusCircle");

      oRm.class("myStatusCircle" + sStatus);

      oRm.style("width", oControl.getSize());
      oRm.style("height", oControl.getSize());

      oRm.openEnd();

      oRm.close("div");
    },
  });
});
