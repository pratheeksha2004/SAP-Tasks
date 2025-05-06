sap.ui.define([], function () {
    "use strict"; // Corrected from "use_strict"
    return {
        ageStatusClass: function (vAge) {
            // Explicitly convert to Number first, then to integer for comparison
            var iAgeNum = Number(vAge); // Handles null, undefined, empty string gracefully to NaN
            var iAgeInt = parseInt(iAgeNum, 10);

            if (isNaN(iAgeInt)) { // Check if it's a valid number after parsing
                return ""; // Return empty string if not a valid number
            }
            // Now iAgeInt is definitely a number or NaN
            return iAgeInt < 18 ? "ageUnderage" : "ageAdult";
        }
    };
});