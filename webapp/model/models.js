sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createViewModel: function () {
            var oViewModel = new JSONModel({
                dashboardCount: 0,
                filterData: {
                        "ApplicationNo": null,
                        "Pernr": null,
                        "CreatedOn": null
                    },
                formDetails: {
                    Status: "",
                    StatusText: ""
                },
                valueState:{
                    DatePlacementCOD: "None",
                    ActualNoOfSecurities: "None",
                    Form5Remarks: "None"
                },
                valueStateText:{
                    DatePlacementCOD: "",
                    ActualNoOfSecurities: "",
                    Form5Remarks: ""
                },
                attachmentData:[]
            });
            oViewModel.setDefaultBindingMode("TwoWay");
            return oViewModel;
        },
    };

});