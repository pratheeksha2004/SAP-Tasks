sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History" // For handling back navigation
], function (Controller, History) {
    "use strict";

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View3", {
    
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         */
        
        onInit: function () {
            // For this very simple view, no specific initialization is needed in onInit.
            // If you were to load data or attach to route patterns, you'd do it here.
        },

        /**
         * Handles the press event of the page's navigation button (the "back" button).
         * Navigates back in the browser history if possible, otherwise navigates to a default route (e.g., View1).
         */
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                // The history contains a previous entry, so navigate backwards
                window.history.go(-1);
            } else {
                // Otherwise, navigate to a default route (e.g., the main view "RouteView1")
                // The 'true' argument for bReplace means the current entry in history is replaced
                // by the new one, so the user won't navigate back to View3 if they use browser back
                // after this.
                var bReplace = true;
                this.getOwnerComponent().getRouter().navTo("RouteView1", {}, bReplace);
            }
        }

        // You can add other methods here later if View3 needs more functionality.
        // For example, if you add buttons or other interactive elements to View3.view.xml,
        // their event handlers would go here.
    });
});