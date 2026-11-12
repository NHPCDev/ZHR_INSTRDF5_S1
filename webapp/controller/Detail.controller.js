sap.ui.define([
    "com/nhpc/zhrinstrdf5s1/controller/BaseController",
    "com/nhpc/zhrinstrdf5s1/utils/formatter",
    "com/nhpc/zhrinstrdf5s1/utils/messenger",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (BaseController, formatter, messenger, BusyIndicator, Filter, FilterOperator) => {
    "use strict";
    let that;
    return BaseController.extend("com.nhpc.zhrinstrdf5s1.controller.Detail", {
        formatter: formatter,
        onInit() {
            that = this;
            this.getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);
        },
        _onRoutePatternMatched: async function (oEvent) {
            let oArgs = oEvent.getParameter("arguments");
            let sApplicationNo = oArgs.ApplicationNo;
            if (!sApplicationNo) {
                messenger.error(this.getResourceBundle().getText("InvalidRouteParameters"), () => {
                    this.getRouter().navTo("RouteDashboard", {}, {}, true);
                });
                return;
            }
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/ApplicationNo", sApplicationNo);
            BusyIndicator.show(0);
            try {
                await this.resetValueStates();
                await this.setFormDetails();
                await this.getDefaultEmployeeDetails();
                await this.readAttachmentsData();
            } catch (error) {
                messenger.error(error, () => {
                    this.getRouter().navTo("RouteDashboard", {}, {}, true);
                });
            } finally {
                BusyIndicator.hide();
            }
        },
        resetValueStates: function () {
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/valueState/DatePlacementCOD", "None");
            oViewModel.setProperty("/valueState/ActualNoOfSecurities", "None");
            oViewModel.setProperty("/valueState/Form5Remarks", "None");
            oViewModel.setProperty("/valueStateText/DatePlacementCOD", "");
            oViewModel.setProperty("/valueStateText/ActualNoOfSecurities", "");
            oViewModel.setProperty("/valueStateText/Form5Remarks", "");
        },
        getDefaultEmployeeDetails: function () {
            return new Promise((resolve, reject) => {
                let oModel = this.getModel(),
                    oViewModel = this.getModel("viewModel"),
                    Pernr = oViewModel.getProperty("/formDetails/Pernr");
                let aFilters = [
                    new Filter(
                        "PERNR",
                        FilterOperator.EQ,
                        Pernr
                    )
                ];
                oModel.read("/ZFI_GH_USER_F4", {
                    filters: aFilters,
                    success: function (oResp) {
                        if (oResp.results && oResp.results.length > 0) {
                            oViewModel.setProperty("/formDetails/EmployeeId", oResp.results[0].PERNR);
                            oViewModel.setProperty("/formDetails/EmployeeName", oResp.results[0].ENAME);
                            oViewModel.setProperty("/formDetails/CompanyCode", oResp.results[0].BUKRS);
                            oViewModel.setProperty("/formDetails/EmployeeGrade", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrp", oResp.results[0].SUB_GROUP);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrpText", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/PersonnelSubArea", oResp.results[0].WERKS);
                            oViewModel.setProperty("/formDetails/PersonnelSubAreaText", oResp.results[0].PLANT);
                            oViewModel.setProperty("/formDetails/EmployeeDepartment", `${oResp.results[0].DEP_CODE} - ${oResp.results[0].DEP}`);
                            // oViewModel.setProperty("/formDetails/Designation", oResp.results[0].DESIG);
                            oViewModel.setProperty("/formDetails/USRID", oResp.results[0].USRID);
                            oViewModel.setProperty("/formDetails/MOBILE", oResp.results[0].MOBILE);
                            oViewModel.setProperty("/formDetails/EMAIL", oResp.results[0].EMAIL);
                            oViewModel.setProperty("/formDetails/DATE_JOIN", oResp.results[0].DATE_JOIN);
                        }
                        resolve();
                    }.bind(this),
                    error: function (oError) {
                        messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        }.bind(this));
                        reject(oError);
                    }.bind(this)
                });
            });
        },
        setFormDetails: async function () {
            let oModel = this.getModel(),
                oViewModel = this.getModel("viewModel"),
                sApplicationNo = oViewModel.getProperty("/ApplicationNo");

            try {
                const [oPreClearResp, oPreApprovedResp] = await Promise.all([
                    new Promise((resolve, reject) => {
                        oModel.read("/PreClearSet", {
                            urlParameters: {
                                "$filter": `ApplicationNo eq '${sApplicationNo}' and ApprovalFlag eq '5'`
                            },
                            success: resolve,
                            error: reject
                        });
                    }),
                    new Promise((resolve, reject) => {
                        oModel.read("/PreapprovedSet", {
                            urlParameters: {
                                "$filter": `ApplicationNo eq '${sApplicationNo}'`,
                                "$expand": "PREAPPROVED_TO_SECURITY"
                            },
                            success: resolve,
                            error: reject
                        });
                    })
                ]);
                if (oPreClearResp.results?.length) {
                    const oData = oPreClearResp.results[0];
                    oViewModel.setProperty("/formDetails", oData);
                    function normalizeValue(value) {
                        const n = Number(value);
                        return n === 0 ? "" : String(n);
                    }
                    if (oData.Status === "05") {
                        that._getHistoryWithRemarksData(oData.Pernr);
                    }
                    oViewModel.setProperty("/formDetails/DatePlacementCOD", normalizeValue(oData.DatePlacementCOD));
                    oViewModel.setProperty("/formDetails/DateOfPurchasePreviousApproval", normalizeValue(oData.DateOfPurchasePreviousApproval));
                    oViewModel.setProperty("/formDetails/DateOfPurchaseAllotment", normalizeValue(oData.DateOfPurchaseAllotment));
                    oViewModel.setProperty("/formDetails/ActualNoOfSecurities", normalizeValue(oData.ActualNoOfSecurities));
                    oViewModel.setProperty("/formDetails/EstimatedNoOfSecurities", normalizeValue(oData.EstimatedNoOfSecurities));
                    oViewModel.setProperty("/formDetails/NatureOfSecurity", oData.Natureofsecurity);
                    oViewModel.setProperty("/formDetails/Compclearancedate", oData.Compclearancedate);
                }
                if (oPreApprovedResp?.results?.length) {
                    if (oPreApprovedResp.results[0].Status?.toUpperCase() !== "03") {
                        oViewModel.setProperty("/tableData", []);
                        return;
                    }
                    let isTradePerformed = oPreApprovedResp.results[0].TradePerformed;
                    if(isTradePerformed === "No"){
                        let oTableData = [];
                        oTableData.push({
                            TransactionDate:"00000000",
                            NoOfSecurities:"0",
                            Price: "0"
                        }) ;
                        oViewModel.setProperty("/tableData",oTableData);
                    }else{
                        oViewModel.setProperty("/tableData", oPreApprovedResp.results[0].PREAPPROVED_TO_SECURITY.results);
                    }                  
                } else {
                    oViewModel.setProperty("/tableData", []);
                }

            } catch (oError) {
                messenger.error(
                    JSON.parse(oError.responseText).error.message.value,
                    function () {
                        this.getRouter().navTo("RouteDashboard", {}, {}, true);
                    }.bind(this)
                );
            }
        },
        _getHistoryWithRemarksData: function (Pernr) {
            var oModel = this.getModel();
            var oVM = this.getModel("viewModel");
            var sApplicationNo = oVM.getProperty("/ApplicationNo");
            var aFilters = [
                new Filter("Pernr", FilterOperator.EQ, Pernr),
                new Filter("FormNo", FilterOperator.EQ, "FORM3"),
                new Filter("ApplicationNo", FilterOperator.EQ, sApplicationNo)
            ];

            oModel.read("/RemarkHistorySet", {
                filters: aFilters,
                success: function (oData) {
                    let sRejected = oData.results.find(i => i.Status === "05")?.Remark;
                    if(sRejected){
                        oVM.setProperty("/formDetails/ReasonsNonClearance",sRejected);
                    }
                }.bind(this),

                error: function () {
                    MessageBox.error("unableToFetchApplicationDetails");
                }
            });
        },
        handleSubmitBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST"),
                bProceed = this.validateSubmitRequestDetails();
            let oViewModel = this.getModel("viewModel");
            let that = this;
            var oModel = this.getModel();
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    let oPayload = this.createRequestPayload();
                    oModel.create("/PreClearSet", oPayload, {
                        success: function (oResp) {
                            BusyIndicator.hide();
                            that.fileUpload(oViewModel.getProperty("/attachmentList"),"Save");
                            messenger.success(oResourceBundle.getText("manageWaiverFinalSuccessMsg", oResp.ApplicationNo), () => {
                                this.getRouter().navTo("RouteDashboard", {}, {}, true);
                            });
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },

        createRequestPayload: function () {
            var oViewModel = this.getModel("viewModel"),
                oFormDetails = oViewModel.getProperty("/formDetails");
            var oPayload = {
                DateOfPurchasePreviousApproval: oFormDetails.DateOfPurchasePreviousApproval,
                NatureOfNewTransaction: oFormDetails.NatureOfNewTransaction,
                EstimatedNoOfSecurities: oFormDetails.EstimatedNoOfSecurities,
                EstimatedConsiderationValue: oFormDetails.EstimatedConsiderationValue,
                ImmediateRelativeName: oFormDetails.ImmediateRelativeName,
                DateOfPurchaseAllotment: oFormDetails.DateOfPurchaseAllotment,
                ReasonsNonClearance: oFormDetails.ReasonsNonClearance,
                DatePlacementCOD: oFormDetails.DatePlacementCOD,
                ActualNoOfSecurities: oFormDetails.ActualNoOfSecurities,
                Form5Remarks: oFormDetails.Form5Remarks,
                ApplicationNo: oFormDetails.ApplicationNo
            };
            return oPayload;
        },

        validateSubmitRequestDetails: function () {
            const oViewModel = this.getModel("viewModel");
            const oResourceBundle = this.getResourceBundle();
            const oRequestDetails = oViewModel.getProperty("/formDetails");
            const aErrors = [];
            // if (!oRequestDetails.Form5Remarks) {
            //     aErrors.push(oResourceBundle.getText("errorRemarksMsg"));
            //     oViewModel.setProperty("/valueState/Form5Remarks", "Error");
            //     oViewModel.setProperty("/valueStateText/Form5Remarks", oResourceBundle.getText("errorRemarksMsg"));
            // } else {
            //     oViewModel.setProperty("/valueState/Form5Remarks", "None");
            //     oViewModel.setProperty("/valueStateText/Form5Remarks", "");
            // }
            if (aErrors.length > 0) {
                messenger.error(oResourceBundle.getText("errorSubmitRequestDetailsMsg"));
                return false;
            }
            return true;
        },
        onTableUpdateFinished: function () {
            let oViewModel = this.getModel("viewModel");
            let oTableData = oViewModel.getProperty("/tableData") || [];
            let oTableLength = oTableData.length;
            oViewModel.setProperty("/tableLength", oTableLength)
        }
    });
});