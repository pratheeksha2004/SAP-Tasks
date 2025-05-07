sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/Fragment",
    "sap/m/BusyDialog",
    "../model/formatter"
], function (Controller, JSONModel, MessageToast, Filter, FilterOperator, Sorter, Fragment, BusyDialog, formatter) {
    "use strict";

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View1", {
        formatter: formatter,
        _bSortNameDescending: false,
        _oAddEditDialog: null,
        _oBusyDialog: null,
        _isEditMode: false,
        _sEditPath: null,

        onInit: function () {
            var oViewModel = new JSONModel({
                details: [],
                dialogTitle: "",
                isDialogSaveEnabled: false,
                dialogSaveButtonText: "Save"
            });
            this.getView().setModel(oViewModel, "formModel");
        },

        _getDialog: function () {
            if (!this._oAddEditDialog) {
                var oView = this.getView();
                this._oAddEditDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.pratheeksha.ui.html5app.view.fragments.AddEditDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            return this._oAddEditDialog;
        },

        onOpenAddDialog: function () {
            this._isEditMode = false;
            this._getDialog().then(function (oDialog) {
                var oDialogModel = new JSONModel({ name: "", age: "" });
                oDialog.setModel(oDialogModel, "dialogModel");
                this.getView().getModel("formModel").setProperty("/dialogTitle", "Add New Detail");
                this.getView().getModel("formModel").setProperty("/isDialogSaveEnabled", false);
                oDialog.open();
            }.bind(this));
        },

        onOpenEditDialog: function (oEvent) {
            this._isEditMode = true; // 1. Set mode to Edit
            var oButton = oEvent.getSource(); // Get the "Edit" button that was clicked
            var oContext = oButton.getBindingContext("formModel"); // Get the data context of the row
            this._sEditPath = oContext.getPath(); // 2. Store the path to the item in formModel (e.g., "/details/1")
            
            // 3. Get a DEEP COPY of the row's data.
            // JSON.parse(JSON.stringify(...)) is a common way to create a true copy
            // so that changes in the dialog don't immediately affect the table row
            // until "Save" is clicked.
            var oRowData = JSON.parse(JSON.stringify(oContext.getObject()));

            this._getDialog().then(function (oDialog) { // Load/get the dialog fragment
                // 4. Create a new JSONModel with the copied row data for the dialog
                var oDialogModel = new JSONModel(oRowData);
                oDialog.setModel(oDialogModel, "dialogModel"); // Set this as "dialogModel" ON THE DIALOG

                // 5. Set the dialog title
                this.getView().getModel("formModel").setProperty("/dialogTitle", "Edit Detail"); // Or use i18n: oResourceBundle.getText("editDialogTitle")

                // 6. Enable the Save button in the dialog because data is pre-filled
                this.getView().getModel("formModel").setProperty("/isDialogSaveEnabled", true);
                
                oDialog.open(); // Open the dialog
            }.bind(this));
        },

        onDialogCancel: function () {
            this._getDialog().then(function(oDialog){
                oDialog.close();
            });
        },

        onDialogSave: function () {
            // --- Get Dialog Instance (ensure this works) ---
            var oDialogInstance = null;
             // Prioritize using a stored instance if available after _getDialog resolves
            if (this._oAddEditDialogInstance) { // Assuming you store the instance here
                 oDialogInstance = this._oAddEditDialogInstance;
            } else if (this._oAddEditDialog && typeof this._oAddEditDialog.close === 'function') { // Check if _oAddEditDialog holds the instance
                 oDialogInstance = this._oAddEditDialog;
            } else {
                 // Fallback to view.byId as last resort
                 oDialogInstance = this.getView().byId("idAddEditDialog");
            }

            if (!oDialogInstance) {
                MessageToast.show("Critical Error: Dialog reference not available.");
                return;
            }

            // --- Get Controls and Values DIRECTLY from Dialog ---
            // Use Fragment.byId to get controls inside the fragment instance
            var oInputName = Fragment.byId(this.getView().getId(), "idDialogInputName");
            var oInputAge = Fragment.byId(this.getView().getId(), "idDialogInputAge");

            if (!oInputName || !oInputAge) {
                 MessageToast.show("Error: Could not find dialog input fields.");
                 return;
            }

            var sName = oInputName.getValue().trim(); // <<< Get CURRENT value
            var sAgeValue = oInputAge.getValue().trim(); // <<< Get CURRENT value

            // --- Get Models ---
            var oMainModel = this.getView().getModel("formModel");
            var oResourceBundle = this.getView().getModel("i18n")?.getResourceBundle();

            console.log("Attempting to Save. Edit Mode:", this._isEditMode, "Path:", this._sEditPath);
            console.log("Values directly from inputs:", sName, "Age String:", sAgeValue);

            // --- Validation ---
            if (!sName || !sAgeValue) {
                MessageToast.show(oResourceBundle?.getText("validationError") || "Please enter both Name and Age.");
                return;
            }
            var iAge = parseInt(sAgeValue, 10);
            if (isNaN(iAge)) {
                MessageToast.show(oResourceBundle?.getText("ageNumericError") || "Age must be a number.");
                return;
            }

            // --- Busy Indicator ---
            this._showBusyDialog("Saving...");

            // --- Save Logic (setTimeout remains for simulation) ---
            setTimeout(function () {
                var aDetails = oMainModel.getProperty("/details"); // Get fresh reference if needed for ADD
                var sSaveMsg = "";

                console.log("Inside setTimeout. Edit Mode:", this._isEditMode, "Path:", this._sEditPath);

                if (this._isEditMode) {
                    console.log("Applying EDIT to path:", this._sEditPath, "with Name:", sName, "Age:", iAge);
                    if (oMainModel.getProperty(this._sEditPath)) {
                        oMainModel.setProperty(this._sEditPath + "/name", sName); // Use sName from input
                        oMainModel.setProperty(this._sEditPath + "/age", iAge);   // Use iAge from input
                        sSaveMsg = oResourceBundle?.getText("updateSuccess", [sName, iAge]) || ("Updated: " + sName + ", Age: " + iAge);
                        console.log("Data after setProperty (Edit):", oMainModel.getProperty(this._sEditPath));
                    } else {
                        console.error("Edit Error: Path", this._sEditPath, "not found in model for update.");
                        sSaveMsg = "Error: Could not find item to update.";
                        this._hideBusyDialog(); // Hide busy dialog on error
                        MessageToast.show(sSaveMsg);
                        oDialogInstance.close();
                        return; // Exit after error
                    }
                } else { // ADD Mode
                    console.log("Applying ADD with Name:", sName, "Age:", iAge);
                    aDetails.push({ name: sName, age: iAge }); // Use sName, iAge from input
                    sSaveMsg = oResourceBundle?.getText("saveSuccess", [sName, iAge]) || ("Saved: " + sName + ", Age: " + iAge);
                }

                console.log("Refreshing Main Model. Current details:", JSON.stringify(oMainModel.getProperty("/details")));
                oMainModel.refresh(true); // Force refresh

                this._hideBusyDialog();
                oDialogInstance.close();
                MessageToast.show(sSaveMsg);
                console.log("Save/Update complete. Message shown:", sSaveMsg);

            }.bind(this), 500); // Keep simulated delay
        },
        onDialogInputChange: function() {
            // The this._oAddEditDialog property should hold the promise that resolves to the dialog
            // Or, if you store the dialog directly after it loads, you'd access that.
            // Let's assume _getDialog ensures this._oAddEditDialog is the promise.
            this._getDialog().then(function(oDialogInstance) { // oDialogInstance is the actual Dialog control
                if (oDialogInstance) {
                    var oDialogModel = oDialogInstance.getModel("dialogModel"); // Get model from THE DIALOG
                    if (oDialogModel) {
                        var oData = oDialogModel.getData();
                        console.log("Dialog Input Change - Data:", oData);
        
                        // Ensure age is treated as a string for the empty check,
                        // even if it's a number or null initially.
                        var sNameValue = oData.name || "";
                        var sAgeValue = oData.age !== null && oData.age !== undefined ? oData.age.toString() : "";
        
                        var bEnabled = !!(sNameValue.trim() && sAgeValue.trim());
                        console.log("Dialog Input Change - Calculated bEnabled:", bEnabled);
        
                        this.getView().getModel("formModel").setProperty("/isDialogSaveEnabled", bEnabled);
                        console.log("Dialog Input Change - formModel>/isDialogSaveEnabled is now:", this.getView().getModel("formModel").getProperty("/isDialogSaveEnabled"));
                    } else {
                        console.error("onDialogInputChange: dialogModel not found on dialog instance!");
                    }
                } else {
                    console.error("onDialogInputChange: Dialog instance not resolved!");
                }
            }.bind(this));
        },

        _showBusyDialog: function (sText) {
            if (!this._oBusyDialog) {
                this._oBusyDialog = new BusyDialog({ text: sText || "Processing..." });
            }
            this._oBusyDialog.setText(sText || "Processing...");
            this._oBusyDialog.open();
        },

        _hideBusyDialog: function () {
            if (this._oBusyDialog) {
                this._oBusyDialog.close();
            }
        },

        onDeletePress: function (oEvent) {
            var oModel = this.getView().getModel("formModel");
            var aDetails = oModel.getProperty("/details");
            var oResourceBundle = this.getView().getModel("i18n")?.getResourceBundle();
            var oItemToDelete = oEvent.getSource().getParent().getParent();
            var oContext = oItemToDelete.getBindingContext("formModel");
            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/").pop());
            aDetails.splice(iIndex, 1);
            oModel.refresh();
            var sDeleteMsg = oResourceBundle?.getText("deleteSuccess") || "Item deleted.";
            MessageToast.show(sDeleteMsg);
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            if (sQuery === undefined) {
                sQuery = oEvent.getParameter("newValue");
            }
            sQuery = sQuery ? sQuery.trim() : "";
            var aFilters = [];
            if (sQuery) {
                var oFilterName = new Filter("name", FilterOperator.Contains, sQuery);
                var oFilterAge = new Filter({
                    path: 'age',
                    test: function(oValue) {
                        return oValue != null && oValue.toString().toLowerCase().includes(sQuery.toLowerCase());
                    }
                });
                 aFilters.push(new Filter({ filters: [oFilterName, oFilterAge], and: false }));
            }
            var oTable = this.byId("idTableData");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        onSort: function (oEvent) {
             this._bSortNameDescending = !this._bSortNameDescending;
            var oSorter = new Sorter("name", this._bSortNameDescending);
            var oTable = this.byId("idTableData");
            var oBinding = oTable.getBinding("items");
            oBinding.sort(oSorter);
            var oSortButton = this.byId("idSortButton");
            oSortButton.setIcon(this._bSortNameDescending ? "sap-icon://sort-descending" : "sap-icon://sort-ascending");
            oSortButton.setTooltip(this._bSortNameDescending ? "Sort Ascending" : "Sort Descending");
        },

        onNavToView2Press: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView2");
        },
        onNavToView3Press: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView3");
        },

        onExit: function() {
            this._getDialog().then(function(oDialog){
                if (oDialog) {
                    oDialog.destroy();
                }
            });
            this._oAddEditDialog = null; // Clear reference
            if (this._oBusyDialog) {
                this._oBusyDialog.destroy();
                this._oBusyDialog = null;
            }
        }
    });
});