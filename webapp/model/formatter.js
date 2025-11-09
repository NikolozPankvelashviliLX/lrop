sap.ui.define([], function () {
  "use strict";

  return {
    formatDate: (dateString) => {
      if (!dateString) {
        return "";
      }
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },

    formatFloorArea: (area) => {
      if (!area) {
        return "";
      }
      return Number(area).toLocaleString();
    },

    formatCurrency: (value) => {
      if (value == null) {
        return "";
      }
      return Number(value).toLocaleString();
    },
  };
});
