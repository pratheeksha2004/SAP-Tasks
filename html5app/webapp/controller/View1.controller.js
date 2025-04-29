sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View1", {

        onInit: function () {
            var oModel = new JSONModel({
                name: "",
                age: "",
                details: []
            });
            this.getView().setModel(oModel, "formModel");
        },

        onSavePress: function () {
            var oView = this.getView();
            var oModel = oView.getModel("formModel");

            var sName = oView.byId("idInputName").getValue().trim();
            var sAge = oView.byId("idInputAge").getValue().trim();

            if (!sName || !sAge) {
                MessageToast.show("Please enter both Name and Age.");
                return;
            }

            var aDetails = oModel.getProperty("/details") || [];

            aDetails.push({
                name: sName,
                age: sAge
            });

            oModel.setProperty("/details", aDetails);

            // Clear input fields
            oView.byId("idInputName").setValue("");
            oView.byId("idInputAge").setValue("");

            MessageToast.show("Saved: " + sName + ", Age: " + sAge);
        },

        onDeletePress: function (oEvent) {
            var oModel = this.getView().getModel("formModel");
            var aDetails = oModel.getProperty("/details");

            var oItem = oEvent.getSource().getParent(); // ColumnListItem
            var oCtx = oItem.getBindingContext("formModel");
            var iIndex = oCtx.getPath().split("/").pop(); // Get index

            aDetails.splice(iIndex, 1); // Remove item
            oModel.setProperty("/details", aDetails);

            MessageToast.show("Item deleted.");
        }
    });
});
