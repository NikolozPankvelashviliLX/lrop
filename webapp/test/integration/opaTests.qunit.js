/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["npproj1/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
