sap.ui.define(["npproj1/model/formatter"], (formatter) => {
  "use strict";

  QUnit.module("Date Formatting");

  QUnit.test("Should return empty string for null/undefined date", (assert) => {
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
  });

  QUnit.test("Should format a valid date string correctly", (assert) => {
    // Arrange
    let sDate = "2023-12-25";

    // Act
    let sResult = formatter.formatDate(sDate);

    // Assert
    assert.notEqual(sResult, "", "Result is not empty");
    assert.ok(sResult.includes("2023"), "Result contains the correct year");
  });

  QUnit.module("Floor Area Formatting");

  QUnit.test("Should return empty string for missing area", (assert) => {
    assert.strictEqual(
      formatter.formatFloorArea(null),
      "",
      "Null returns empty string"
    );
  });

  QUnit.test("Should format a number with locale separators", (assert) => {
    // Arrange
    let sArea = "10000";
    let iArea = 10000;

    // Act & Assert
    let sResultString = formatter.formatFloorArea(sArea);
    let sResultNumber = formatter.formatFloorArea(iArea);

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
  });

  QUnit.module("Currency Formatting");

  QUnit.test("Should return empty string for missing value", (assert) => {
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
  });

  QUnit.test("Should format currency with separators", (assert) => {
    let iValue = 5000000;
    let sResult = formatter.formatCurrency(iValue);

    // Assert it creates a longer string than the input (implying separators were added)
    assert.ok(sResult.length > 7, "Currency formatted with separators");
  });

  QUnit.module("Area State Logic");

  QUnit.test("Should return 'Success' for huge areas (> 5000)", (assert) => {
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
  });

  QUnit.test(
    "Should return 'Warning' for medium areas (> 3000 and <= 5000)",
    (assert) => {
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

  QUnit.test("Should return 'Error' for small areas (<= 3000)", (assert) => {
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
  });
});
