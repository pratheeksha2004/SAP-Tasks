sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View1", {
        
        onInit: function () {
            // Create empty model and set it to view
            var oModel = new JSONModel({
                name: "",
                age: ""
            });
            this.getView().setModel(oModel, "formModel");
        },

        onSavePress: function (oEvent) {
            var oView = this.getView();
            
            // Get values from inputs
            var sName = oView.byId("nameInput").getValue();
            var sAge = oView.byId("ageInput").getValue();

            // Update JSON model
            var oModel = oView.getModel("formModel");
            oModel.setProperty("/name", sName);
            oModel.setProperty("/age", sAge);

            // Show a Message Toast
            sap.m.MessageToast.show("Data Saved: " + sName + ", Age: " + sAge);
        }
    });
});
