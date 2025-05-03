sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History" // <<< Import History module
], function (Controller, History) {
    "use strict";

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View2", {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         */
        onInit: function () {
            // No specific init logic needed for just displaying bound data yet
            // You could potentially get the router here if needed frequently
            // var oRouter = this.getOwnerComponent().getRouter();
        },

        /**
         * Handles the press event of the page's navigation button (back button).
         */
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                // The history contains a previous entry
                window.history.go(-1);
            } else {
                // Otherwise we go backwards with a forward history
                var bReplace = true; // Don't want this back navigation step in the history
                this.getOwnerComponent().getRouter().navTo("RouteView1", {}, bReplace);
            }
        }

        /**
         * Example: If you needed to manually trigger data loading or filtering later
         * onSomeAction: function() {
         *    var oTable = this.byId("idProductsTable");
         *    var oBinding = oTable.getBinding("items");
         *    // oBinding.filter(...) or oBinding.refresh(...)
         * }
         */

    });
});