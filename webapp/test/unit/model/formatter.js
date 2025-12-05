/*global QUnit*/
sap.ui.define(
  ["npproj1/model/formatter", "sap/ui/core/format/DateFormat"],
  function (formatter, DateFormat) {
    "use strict";

    QUnit.module("Date Formatting");

    QUnit.test(
      "Should return empty string for null/undefined date",
      function (assert) {
        assert.strictEqual(
          formatter.formatDate(null),
          "",
          "Null input returns empty string"
        );
        assert.strictEqual(
          formatter.formatDate(undefined),
          "",
          "Undefined input returns empty string"
        );
      }
    );

    QUnit.test(
      "Should format a valid date string correctly",
      function (assert) {
        // Arrange
        var sDate = "2023-12-25";

        // Act
        var sResult = formatter.formatDate(sDate);

        // Assert
        assert.notEqual(sResult, "", "Result is not empty");
        assert.ok(sResult.includes("2023"), "Result contains the correct year");
      }
    );

    QUnit.module("Floor Area Formatting");

    QUnit.test(
      "Should return empty string for missing area",
      function (assert) {
        assert.strictEqual(
          formatter.formatFloorArea(null),
          "",
          "Null returns empty string"
        );
      }
    );

    QUnit.test(
      "Should format a number with locale separators",
      function (assert) {
        // Arrange
        var sArea = "10000";
        var iArea = 10000;

        // Act & Assert
        var sResultString = formatter.formatFloorArea(sArea);
        var sResultNumber = formatter.formatFloorArea(iArea);

        assert.strictEqual(
          sResultString.length > 5,
          true,
          "String input formatted with separators"
        );
        assert.strictEqual(
          sResultNumber.length > 5,
          true,
          "Number input formatted with separators"
        );
      }
    );

    QUnit.module("Currency Formatting");

    QUnit.test(
      "Should return empty string for missing value",
      function (assert) {
        assert.strictEqual(
          formatter.formatCurrency(null),
          "",
          "Null returns empty string"
        );
        assert.strictEqual(
          formatter.formatCurrency(0),
          "",
          "Zero returns empty string (based on your logic !iValue)"
        );
      }
    );

    QUnit.test("Should format currency with separators", function (assert) {
      var iValue = 5000000;
      var sResult = formatter.formatCurrency(iValue);

      // Assert it creates a longer string than the input (implying separators were added)
      assert.ok(sResult.length > 7, "Currency formatted with separators");
    });

    QUnit.module("Area State Logic");

    QUnit.test(
      "Should return 'Success' for huge areas (> 5000)",
      function (assert) {
        assert.strictEqual(
          formatter.formatAreaState(5001),
          "Success",
          "5001 returns Success"
        );
        assert.strictEqual(
          formatter.formatAreaState(10000),
          "Success",
          "10000 returns Success"
        );
      }
    );

    QUnit.test(
      "Should return 'Warning' for medium areas (> 3000 and <= 5000)",
      function (assert) {
        assert.strictEqual(
          formatter.formatAreaState(5000),
          "Warning",
          "5000 (Boundary) returns Warning"
        );
        assert.strictEqual(
          formatter.formatAreaState(3001),
          "Warning",
          "3001 returns Warning"
        );
      }
    );

    QUnit.test(
      "Should return 'Error' for small areas (<= 3000)",
      function (assert) {
        assert.strictEqual(
          formatter.formatAreaState(3000),
          "Error",
          "3000 (Boundary) returns Error"
        );
        assert.strictEqual(
          formatter.formatAreaState(100),
          "Error",
          "100 returns Error"
        );
      }
    );
  }
);
