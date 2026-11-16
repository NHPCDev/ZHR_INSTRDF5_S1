sap.ui.define(["sap/ui/core/IconPool",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/format/DateFormat"
], function (IconPool, NumberFormat, DateFormat) {
    'use strict';

    return {
        formatAttachmentIcon: function (mime) {
            if (mime !== null || mime !== "") {
                return sap.ui.core.IconPool.getIconForMimeType(mime);
            }
        },
        formatStatusState: function (status) {
            if (status) {
                if (status === "03") {
                    return "Success";
                } else if (status === "02" || status === "New") {
                    return "Information";
                } else if (status === "01") {
                    return "Warning";
                } else if (status === "05") {
                    return "Error"
                } else {
                    return "Warning"
                }
            }
        },
        formatDate: function (sDate) {
            if (sDate) {
                // if (sDate === "00000000") {
                //     return "";
                // }
                if (sDate.length === 8) {
                    var sYear = sDate.substring(0, 4);
                    var sMonth = sDate.substring(4, 6);
                    var sDay = sDate.substring(6, 8);
                    return sDay + "." + sMonth + "." + sYear;
                } else {
                    return sDate;
                }
            }
            return "";
        },
        formatStatusDateForStatus: function (sStatus,sApprovedOn,sRejectedOn) {
            let sDate;
            if(sStatus === "Approved"){
                sDate = sApprovedOn
            } else {
                sDate = sRejectedOn
            }
            if (sDate) {
                if (sDate === "00000000") {
                    return "";
                }
                if (sDate.length === 8) {
                    var sYear = sDate.substring(0, 4);
                    var sMonth = sDate.substring(4, 6);
                    var sDay = sDate.substring(6, 8);
                    return sDay + "." + sMonth + "." + sYear;
                } else {
                    return sDate;
                }
            }
            return "";
        },
        formatDateNew: function (sDate) {
            if (!sDate) {
                return "";
            }

            var aParts = sDate?.split(".");

            if (aParts[2]?.length === 2) {
                aParts[2] = "20" + aParts[2];
            }

            return aParts?.join(".");
        },
        formatTime: function (sTime) {
            if (sTime) {
                if (sTime.length === 6) {
                    var sHours = sTime.substring(0, 2);
                    var sMinutes = sTime.substring(2, 4);
                    var sSeconds = sTime.substring(4, 6);
                    return sHours + ":" + sMinutes + ":" + sSeconds;
                } else {
                    return sTime;
                }
            }
            return "";
        },
        formatBlankValue: function (value) {
            if (!value) {
                return "-";
            } else {
                return value;
            }
        },
        formatNatureOfTransaction: function (sValue) {
            switch (sValue) {
                case "S":
                    return "Sell";
                case "P":
                    return "Buy";
                default:
                    return sValue || "";
            }
        },
        formatZeros: function (value) {
            if (!value || value === "0000000000") {
                return "";
            }
            return value;
        },
        formatAmountToINR: function (vValue) {
            if (vValue === null || vValue === undefined || vValue === "") {
                return "";
            }
            var oLocale = new sap.ui.core.Locale("en-IN");
            var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                decimals: 2
            }, oLocale);
            var fAmount = Number(vValue);
            if (isNaN(fAmount)) {
                return "";
            }
            return oCurrencyFormat.format(fAmount, "INR");
        },
        formatNumbers: function(sNumber){
            return Number(sNumber)?.toString();
        }
    }
});