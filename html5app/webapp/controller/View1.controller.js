sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",         // <<< Required for filtering
    "sap/ui/model/FilterOperator", // <<< Required for filter conditions
    "sap/ui/model/Sorter"          // <<< Required for sorting
], function (Controller, JSONModel, MessageToast, Filter, FilterOperator, Sorter) { // < Added parameters
    "use strict";

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View1", {

        // Variable to keep track of the sort order for the Name column
        _bSortNameDescending: false,

        onInit: function () {
            var oModel = new JSONModel({
                // inputName: "", // Can store input values here if needed for binding
                // inputAge: "",
                details: []   // Array to hold the table data
            });
            this.getView().setModel(oModel, "formModel");
        },

        onSavePress: function () {
            var oView = this.getView();
            var oModel = oView.getModel("formModel");
            var oResourceBundle = oView.getModel("i18n")?.getResourceBundle(); // Optional chaining for safety

            var oInputName = oView.byId("idInputName");
            var oInputAge = oView.byId("idInputAge");

            var sName = oInputName.getValue().trim();
            var sAge = oInputAge.getValue().trim();

            // Simple validation
            if (!sName || !sAge) {
                MessageToast.show(oResourceBundle?.getText("validationError") || "Please enter both Name and Age.");
                // Add 'validationError=Please enter both Name and Age.' to i18n.properties
                return;
            }
            if (isNaN(parseInt(sAge, 10))) { // Check if age is a number
                 MessageToast.show(oResourceBundle?.getText("ageNumericError") || "Age must be a number.");
                 // Add 'ageNumericError=Age must be a number.' to i18n.properties
                return;
            }

            var aDetails = oModel.getProperty("/details"); // Get current array (guaranteed to exist by onInit)

            aDetails.push({
                name: sName,
                age: parseInt(sAge, 10) // Store age as number for potentially better sorting/filtering
            });

            // No need for setProperty if using push on the array directly *referenced* from the model
            oModel.refresh(true); // Force model update, true forces bindings refresh

            // Clear input fields
            oInputName.setValue("");
            oInputAge.setValue("");

            var sSaveMsg = oResourceBundle?.getText("saveSuccess", [sName, sAge]) || ("Saved: " + sName + ", Age: " + sAge);
            // Add 'saveSuccess=Saved: {0}, Age: {1}' to i18n.properties
            MessageToast.show(sSaveMsg);
        },

        onDeletePress: function (oEvent) {
            var oModel = this.getView().getModel("formModel");
            var aDetails = oModel.getProperty("/details");
            var oResourceBundle = this.getView().getModel("i18n")?.getResourceBundle();

            // The item to delete is the parent of the button pressed
            var oItemToDelete = oEvent.getSource().getParent();
            var oContext = oItemToDelete.getBindingContext("formModel");

            // Get the path (e.g., "/details/2") and extract the index
            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/").pop());

            // Remove the item from the array
            aDetails.splice(iIndex, 1);

            // Refresh the model to update the table
            oModel.refresh(true); // Use refresh after splice

            var sDeleteMsg = oResourceBundle?.getText("deleteSuccess") || "Item deleted.";
            // Add 'deleteSuccess=Item deleted.' to i18n.properties
            MessageToast.show(sDeleteMsg);
        },

        // --- Search Functionality ---
        onSearch: function (oEvent) {
            // Get the search query
            var sQuery = oEvent.getParameter("query");
            if (sQuery === undefined) {
                // On liveChange, the query is in the value parameter
                sQuery = oEvent.getParameter("newValue");
            }
            sQuery = sQuery ? sQuery.trim() : ""; // Handle potential null/undefined query

            // Build filter array
            var aFilters = [];
            if (sQuery) {
                // Create filters for Name and Age case 
                var oFilterName = new Filter("name", FilterOperator.Contains, sQuery);
                // Since age is stored as number, we might need to compare differently
                // Let's try filtering if the query string is part of the age converted to string
                var oFilterAge = new Filter({
                    path: 'age',
                    test: function(oValue) { // Custom filter function
                        // oValue is the age (number) from the model
                        return oValue != null && oValue.toString().includes(sQuery);
                    }
                });


                // Combine filters with OR logic (match name OR age)
                 aFilters.push(new Filter({
                    filters: [oFilterName, oFilterAge],
                    and: false // OR condition
                 }));
            }

            // Get list binding
            var oTable = this.byId("idTableData");
            var oBinding = oTable.getBinding("items");

            // Apply filter to binding
            oBinding.filter(aFilters); // Pass array of filters (even if empty or just one combined filter)
        },

        // --- Sort Functionality ---
        onSort: function (oEvent) {
            // Toggle the sort direction state
            this._bSortNameDescending = !this._bSortNameDescending;

            // Create a Sorter object for the 'name' property
            var oSorter = new Sorter("name", this._bSortNameDescending);

            // Get list binding
            var oTable = this.byId("idTableData");
            var oBinding = oTable.getBinding("items");

            // Apply sorter to binding
            oBinding.sort(oSorter);

            // Optional: Update button icon/tooltip to show current sort direction
            var oSortButton = this.byId("idSortButton");
            oSortButton.setIcon(this._bSortNameDescending ? "sap-icon://sort-descending" : "sap-icon://sort-ascending");
            oSortButton.setTooltip(this._bSortNameDescending ? "Sort Ascending" : "Sort Descending");
        }

    });
});