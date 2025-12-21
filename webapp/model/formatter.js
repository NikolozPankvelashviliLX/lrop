sap.ui.define([], () => {
  "use strict";

  return {
    formatDate: (sDate) => {
      if (!sDate) {
        return "";
      }
      const date = new Date(sDate);
      return date.toLocaleDateString();
    },

    formatFloorArea: (sArea) => {
      if (!sArea) {
        return "";
      }
      return Number(sArea).toLocaleString();
    },

    formatCurrency: (iValue) => {
      if (!iValue) {
        return "";
      }
      return Number(iValue).toLocaleString();
    },

    formatAreaState: (iFloorArea) => {
      if (iFloorArea > 5000) {
        return "Success";
      } else if (iFloorArea > 3000) {
        return "Warning";
      } else {
        return "Error";
      }
    },
  };
});
