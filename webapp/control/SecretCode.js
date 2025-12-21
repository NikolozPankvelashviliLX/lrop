sap.ui.define(["sap/ui/core/Control"], (Control) => {
  "use strict";

  return Control.extend("npproj1.control.SecretCode", {
    metadata: {
      properties: {
        text: { type: "string", defaultValue: "" },
      },
    },

    init: function () {
      this._bRevealed = false;
    },

    renderer: (oRm, oControl) => {
      oRm.openStart("span", oControl);
      oRm.class("mySecretCode");

      oRm.attr("tabindex", "0");
      oRm.attr("role", "button");
      oRm.attr("aria-expanded", oControl._bRevealed);

      oRm.openEnd();

      if (oControl._bRevealed) {
        oRm.text(oControl.getText());
      } else {
        oRm.text("****** (Click to show)");
      }

      oRm.close("span");
    },

    ontap: function () {
      this._bRevealed = !this._bRevealed;

      this.invalidate();
    },

    onsapenter: function (oEvent) {
      this.ontap(oEvent);
    },

    onsapspace: function (oEvent) {
      this.ontap(oEvent);
    },
  });
});
