sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",         // For Delete confirmation
    "sap/m/BusyDialog"          // If needed
], function (Controller, History, JSONModel, Fragment, MessageToast, Filter, FilterOperator, Sorter, MessageBox, BusyDialog) {
    "use strict";

    const ITEMS_PER_PAGE = 5; // Items per page for View3 table

    return Controller.extend("com.pratheeksha.ui.html5app.controller.View3", {

        _fullData: [],             // Holds complete data from JSON file
        _workingData: [],          // Holds data after filtering/sorting
        _currentPageIndex: 0,      // 0-based index for pagination
        _oItemDialog: null,        // Reference to the loaded dialog fragment
        _isEditMode: false,
        _editItemOriginalIndex: -1,// Index of item being edited in _fullData array
        _bItemNameSortDescending: false, // Sort state for Item Name

        onInit: function () {
            var oViewModel = new JSONModel({
                pagedItems: [],
                currentPage: 1,
                totalPages: 0,
                isPreviousEnabled: false,
                isNextEnabled: false,
                dialogTitle: "",
                isDialogSaveEnabled: false,
                dialogSaveButtonText: "Save"
            });
            this.getView().setModel(oViewModel, "viewModel"); // Main model for view state

            this._loadDataAndInitialize();

            // Optional: Attach router pattern matched if needed
            // var oRouter = this.getOwnerComponent().getRouter();
            // oRouter.getRoute("RouteView3").attachPatternMatched(this._onRouteMatched, this);
        },

        _loadDataAndInitialize: function() {
            var sDataPath = sap.ui.require.toUrl("com/pratheeksha/ui/html5app/data/predefinedItems.json");
            var oDataModel = new JSONModel();
            var oView = this.getView();
            oView.setBusy(true);

            oDataModel.loadData(sDataPath)
                .then(function() {
                    this._fullData = oDataModel.getData() || [];
                    this._workingData = [...this._fullData]; // Initialize working data
                    this._currentPageIndex = 0; // Reset to first page
                    this._applyPaginationAndFilterSort();
                    oView.setBusy(false);
                }.bind(this))
                .catch(function(oError) {
                    console.error("Error loading predefinedItems.json: ", oError);
                    this._fullData = [];
                    this._workingData = [];
                    this._applyPaginationAndFilterSort(); // Update UI state even on error
                    oView.setBusy(false);
                    MessageBox.error("Failed to load item data.");
                }.bind(this));
        },

        _applyPaginationAndFilterSort: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var iTotalItems = this._workingData.length; // Paginate based on working data
            var iTotalPages = Math.ceil(iTotalItems / ITEMS_PER_PAGE);

            this._currentPageIndex = Math.max(0, Math.min(this._currentPageIndex, iTotalPages - 1));

            var iStartIndex = this._currentPageIndex * ITEMS_PER_PAGE;
            var iEndIndex = iStartIndex + ITEMS_PER_PAGE;

            var aCurrentPageItems = this._workingData.slice(iStartIndex, iEndIndex);

            oViewModel.setProperty("/pagedItems", aCurrentPageItems);
            oViewModel.setProperty("/currentPage", iTotalPages === 0 ? 0 : this._currentPageIndex + 1); // Show 0 if no pages
            oViewModel.setProperty("/totalPages", iTotalPages);
            oViewModel.setProperty("/isPreviousEnabled", this._currentPageIndex > 0);
            oViewModel.setProperty("/isNextEnabled", this._currentPageIndex < iTotalPages - 1);
        },

        // --- Pagination Handlers ---
        onPreviousPage: function () {
            if (this._currentPageIndex > 0) {
                this._currentPageIndex--;
                this._applyPaginationAndFilterSort();
            }
        },

        onNextPage: function () {
            var iTotalPages = Math.ceil(this._workingData.length / ITEMS_PER_PAGE);
            if (this._currentPageIndex < iTotalPages - 1) {
                this._currentPageIndex++;
                this._applyPaginationAndFilterSort();
            }
        },

        // --- Search & Sort (Operating on _workingData) ---
        onSearchItems: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            if (sQuery === undefined) { sQuery = oEvent.getParameter("newValue"); } // Handle liveChange
            sQuery = sQuery ? sQuery.trim().toLowerCase() : "";

            if (!sQuery) {
                this._workingData = [...this._fullData]; // Reset to full data if query is empty
            } else {
                this._workingData = this._fullData.filter(function (item) {
                    return (item.itemName && item.itemName.toLowerCase().includes(sQuery)) ||
                           (item.category && item.category.toLowerCase().includes(sQuery));
                });
            }

            this._currentPageIndex = 0; // Reset to first page
            this._applyPaginationAndFilterSort();
        },

        onSortItems: function (oEvent) {
            this._bItemNameSortDescending = !this._bItemNameSortDescending;
            var bDescending = this._bItemNameSortDescending;

            this._workingData.sort(function (a, b) {
                var nameA = a.itemName.toLowerCase();
                var nameB = b.itemName.toLowerCase();
                if (nameA < nameB) { return bDescending ? 1 : -1; }
                if (nameA > nameB) { return bDescending ? -1 : 1; }
                return 0;
            });

             var oSortButton = this.byId("idItemSortButton");
             oSortButton.setIcon(bDescending ? "sap-icon://sort-descending" : "sap-icon://sort-ascending");

            this._currentPageIndex = 0; // Reset to first page
            this._applyPaginationAndFilterSort();
        },

        // --- Dialog Handling ---
        _getItemDialog: function () {
            return new Promise(function(resolve) {
                if (!this._oItemDialog) {
                    var oView = this.getView();
                    Fragment.load({
                        id: oView.getId(),
                        name: "com.pratheeksha.ui.html5app.view.fragments.ItemDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        this._oItemDialog = oDialog; // Store the loaded dialog
                        resolve(this._oItemDialog);
                    }.bind(this));
                } else {
                    resolve(this._oItemDialog); // Return already loaded dialog
                }
            }.bind(this));
        },

        onOpenAddItemDialog: function () {
            this._isEditMode = false;
            this._getItemDialog().then(function (oDialog) {
                // Generate next ID (simple example, use a better method in real apps)
                var iNextId = (this._fullData.reduce(function(max, item) { return Math.max(max, item.id || 0); }, 0) || 0) + 1;

                oDialog.setModel(new JSONModel({ id: iNextId, itemName: "", category: "", stock: null }), "dialogModel");
                this.getView().getModel("viewModel").setProperty("/dialogTitle", "Add New Item");
                this.getView().getModel("viewModel").setProperty("/dialogSaveButtonText", "Add");
                this.getView().getModel("viewModel").setProperty("/isDialogSaveEnabled", false); // Disable save initially
                oDialog.open();
            }.bind(this));
        },

        onOpenEditItemDialog: function (oEvent) {
            this._isEditMode = true;
            var oContext = oEvent.getSource().getBindingContext("viewModel"); // Context from pagedItems
            var oSelectedItem = oContext.getObject();

            // Find the index in the original _fullData array
            this._editItemOriginalIndex = this._fullData.findIndex(function(item) {
                return item.id === oSelectedItem.id; // Match by unique ID
            });

            if (this._editItemOriginalIndex === -1) {
                MessageBox.error("Could not find the item to edit in the original data.");
                return;
            }

            var oRowDataCopy = JSON.parse(JSON.stringify(this._fullData[this._editItemOriginalIndex]));

            this._getItemDialog().then(function (oDialog) {
                oDialog.setModel(new JSONModel(oRowDataCopy), "dialogModel");
                this.getView().getModel("viewModel").setProperty("/dialogTitle", "Edit Item");
                this.getView().getModel("viewModel").setProperty("/dialogSaveButtonText", "Update");
                this.getView().getModel("viewModel").setProperty("/isDialogSaveEnabled", true); // Enable as pre-filled
                oDialog.open();
            }.bind(this));
        },

        onDialogCancelItem: function () {
            this._getItemDialog().then(function(oDialog){
                oDialog.close();
            });
        },

        onDialogSaveItem: function () {
            var oDialog = this._oItemDialog; // Assumes dialog is loaded and stored
            if (!oDialog) { MessageToast.show("Dialog not loaded."); return; }

            var oDialogModel = oDialog.getModel("dialogModel");
            var oItemData = oDialogModel.getData();
            var oResourceBundle = this.getView().getModel("i18n")?.getResourceBundle();

            var sItemName = oItemData.itemName ? oItemData.itemName.trim() : "";
            var sCategory = oItemData.category ? oItemData.category.trim() : "";
            var sStock = oItemData.stock !== null && oItemData.stock !== undefined ? oItemData.stock.toString().trim() : "";

            if (!sItemName || !sCategory || !sStock) {
                MessageBox.warning(oResourceBundle?.getText("validationErrorItems") || "Please fill in all item fields.");
                return;
            }
            var iStock = parseInt(sStock, 10);
            if (isNaN(iStock) || iStock < 0) {
                 MessageBox.warning(oResourceBundle?.getText("stockNumericError") || "Stock must be a non-negative number.");
                return;
            }

            // Optional: Show busy indicator
            // this._showBusyDialog(); // Implement if needed

            // Simulate save delay if needed
            // setTimeout(function() { // << Start Timeout

            var sSaveMsg = "";
            if (this._isEditMode) {
                if (this._editItemOriginalIndex !== -1) {
                    // Update _fullData
                    this._fullData[this._editItemOriginalIndex] = {
                        id: oItemData.id, // Keep original ID
                        itemName: sItemName,
                        category: sCategory,
                        stock: iStock
                    };
                    // Also update _workingData if the item exists there
                    var iWorkingIndex = this._workingData.findIndex(item => item.id === oItemData.id);
                    if (iWorkingIndex !== -1) {
                         this._workingData[iWorkingIndex] = this._fullData[this._editItemOriginalIndex];
                    }
                    sSaveMsg = oResourceBundle?.getText("updateSuccessItem") || "Item updated.";
                } else {
                    sSaveMsg = "Error updating item: Original index not found.";
                }
            } else { // Add mode
                var newItem = {
                    id: oItemData.id, // Use generated ID
                    itemName: sItemName,
                    category: sCategory,
                    stock: iStock
                };
                this._fullData.push(newItem);
                 // When adding, reset filter/sort to show all data including the new one
                this._workingData = [...this._fullData]; // Update working data
                this._currentPageIndex = Math.max(0, Math.ceil(this._workingData.length / ITEMS_PER_PAGE) - 1); // Go to last page
                sSaveMsg = oResourceBundle?.getText("saveSuccessItem") || "Item added.";
            }

            this._applyPaginationAndFilterSort(); // Refresh table display
            oDialog.close();
            MessageToast.show(sSaveMsg);

            // this._hideBusyDialog(); // If busy dialog was shown
            // }.bind(this), 300); // << End Timeout simulation
        },

        onDialogInputChange: function() {
            // Enable Save button only if all required fields have values
            var oDialog = this._oItemDialog;
            if (oDialog) {
                var oDialogModel = oDialog.getModel("dialogModel");
                if (oDialogModel) {
                    var oData = oDialogModel.getData();
                    var sStockValue = oData.stock !== null && oData.stock !== undefined ? oData.stock.toString() : "";
                    var bEnabled = !!(oData.itemName?.trim() && oData.category?.trim() && sStockValue.trim());
                    this.getView().getModel("viewModel").setProperty("/isDialogSaveEnabled", bEnabled);
                }
            }
        },

        // --- Delete ---
        onDeleteItem: function(oEvent) {
             var oContext = oEvent.getSource().getBindingContext("viewModel");
             var oItemToDelete = oContext.getObject();
             var oResourceBundle = this.getView().getModel("i18n")?.getResourceBundle();

             MessageBox.confirm(oResourceBundle?.getText("deleteConfirmMsg", [oItemToDelete.itemName]) || `Are you sure you want to delete "${oItemToDelete.itemName}"?`, {
                 title: oResourceBundle?.getText("deleteConfirmTitle") || "Confirm Deletion",
                 onClose: function(oAction) {
                     if (oAction === MessageBox.Action.OK) {
                         this._performDelete(oItemToDelete.id);
                     }
                 }.bind(this)
             });
        },

        _performDelete: function(itemIdToDelete) {
            var iIndexFull = this._fullData.findIndex(item => item.id === itemIdToDelete);
            var iIndexWorking = this._workingData.findIndex(item => item.id === itemIdToDelete);
            var oResourceBundle = this.getView().getModel("i18n")?.getResourceBundle();

            var bDeleted = false;
            if (iIndexFull !== -1) {
                this._fullData.splice(iIndexFull, 1);
                bDeleted = true; // Mark as deleted from source
            }
            if (iIndexWorking !== -1) {
                 this._workingData.splice(iIndexWorking, 1);
            }

            if (bDeleted) {
                // Adjust current page if necessary (e.g., last item on page deleted)
                 var iTotalItems = this._workingData.length;
                 var iTotalPages = Math.ceil(iTotalItems / ITEMS_PER_PAGE);
                 if (this._currentPageIndex >= iTotalPages && this._currentPageIndex > 0) {
                    this._currentPageIndex = iTotalPages - 1;
                 }

                this._applyPaginationAndFilterSort(); // Refresh table
                MessageToast.show(oResourceBundle?.getText("deleteSuccessItem") || "Item deleted.");
            } else {
                 MessageToast.show("Error: Item not found for deletion.");
            }
        },

        // --- Navigation ---
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteView1", {}, true);
            }
        },

        // --- Cleanup ---
        onExit: function() {
             if (this._oItemDialog) {
                this._oItemDialog.destroy();
                this._oItemDialog = null;
             }
             // Destroy other resources if needed
        }

    });
});