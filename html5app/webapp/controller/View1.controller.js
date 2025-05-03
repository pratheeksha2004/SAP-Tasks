sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function (Controller, JSONModel, MessageToast, Filter, FilterOperator, Sorter) {
    "use strict";

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View1", {

        _bSortNameDescending: false,

        onInit: function () {
            var oModel = new JSONModel({
                details: []
            });
            this.getView().setModel(oModel, "formModel");
        },

        onSavePress: function () {
            var oView = this.getView();
            var oModel = oView.getModel("formModel");
            var oResourceBundle = oView.getModel("i18n")?.getResourceBundle();

            var oInputName = oView.byId("idInputName");
            var oInputAge = oView.byId("idInputAge");

            var sName = oInputName.getValue().trim();
            var sAge = oInputAge.getValue().trim();

            if (!sName || !sAge) {
                MessageToast.show(oResourceBundle?.getText("validationError") || "Please enter both Name and Age.");
                return;
            }
            if (isNaN(parseInt(sAge, 10))) {
                 MessageToast.show(oResourceBundle?.getText("ageNumericError") || "Age must be a number.");
                return;
            }

            var aDetails = oModel.getProperty("/details");

            aDetails.push({
                name: sName,
                age: parseInt(sAge, 10)
            });

            oModel.refresh(true);

            oInputName.setValue("");
            oInputAge.setValue("");

            var sSaveMsg = oResourceBundle?.getText("saveSuccess", [sName, sAge]) || ("Saved: " + sName + ", Age: " + sAge);
            MessageToast.show(sSaveMsg);
        },

        onDeletePress: function (oEvent) {
            var oModel = this.getView().getModel("formModel");
            var aDetails = oModel.getProperty("/details");
            var oResourceBundle = this.getView().getModel("i18n")?.getResourceBundle();

            var oItemToDelete = oEvent.getSource().getParent();
            var oContext = oItemToDelete.getBindingContext("formModel");

            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/").pop());

            aDetails.splice(iIndex, 1);
            oModel.refresh(true);

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
                        return oValue != null && oValue.toString().includes(sQuery);
                    }
                });
                 aFilters.push(new Filter({
                    filters: [oFilterName, oFilterAge],
                    and: false
                 }));
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

        // --- Navigation Function - ADDED HERE ---
        onNavToView2Press: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            // Navigate using the route name defined in manifest.json
            oRouter.navTo("RouteView2");
        }

    });
});