sap.ui.define(["sap/ui/core/Control"], (Control) => {
  "use strict";

  return Control.extend("npproj1.control.StatusCircle", {
    metadata: {
      properties: {
        status: { type: "string", defaultValue: "None" },
        size: { type: "sap.ui.core.CSSSize", defaultValue: "1rem" },
      },
    },

    /**
     * Renders the HTML for the status circle.
     * * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered.
     */
    renderer: (oRm, oControl) => {
      let sStatus = oControl.getStatus();

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
