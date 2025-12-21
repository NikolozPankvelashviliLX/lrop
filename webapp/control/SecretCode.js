sap.ui.define(["sap/ui/core/Control"], (Control) => {
  "use strict";

  return Control.extend("npproj1.control.SecretCode", {
    metadata: {
      properties: {
        text: { type: "string", defaultValue: "" },
      },
    },

    /**
     * Initializes the control. Sets the initial revealed state to false.
     * @public
     */
    init: function () {
      this._bRevealed = false;
    },

    /**
     * Renders the HTML for the control.
     * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered.
     * @public
     */
    renderer: (oRm, oControl) => {
      const oResourceBundle = oControl.getModel("i18n").getResourceBundle();

      oRm.openStart("span", oControl);
      oRm.class("mySecretCode");

      oRm.attr("tabindex", "0");
      oRm.attr("role", "button");
      oRm.attr("aria-expanded", oControl._bRevealed);

      oRm.openEnd();

      if (oControl._bRevealed) {
        oRm.text(oControl.getText());
      } else {
        oRm.text(oResourceBundle.getText("secretPlaceholder"));
      }

      oRm.close("span");
    },

    /**
     * Event handler for the tap/click event. Toggles the revealed state.
     * @param {sap.ui.base.Event} oEvent The event object.
     * @public
     */
    ontap: function () {
      this._bRevealed = !this._bRevealed;

      this.invalidate();
    },

    /**
     * Event handler for the Enter key.
     * @param {sap.ui.base.Event} oEvent The event object.
     * @public
     */
    onsapenter: function (oEvent) {
      this.ontap(oEvent);
    },

    /**
     * Event handler for the Space key.
     * @param {sap.ui.base.Event} oEvent The event object.
     * @public
     */
    onsapspace: function (oEvent) {
      this.ontap(oEvent);
    },
  });
});
