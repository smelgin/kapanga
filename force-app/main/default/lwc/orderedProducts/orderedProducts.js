/**
 * addOrderableProducts
 * Object: Add orderable products to the current order.
 * Events fired:
 *
 * @author: Ernesto S Melgin <esmelgin@gmail.com>
 */
import { LightningElement, wire, track, api } from "lwc";
import {
  getRecord,
  getFieldValue,
  getRecordNotifyChange
} from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getOrderProducts from "@salesforce/apex/OrderableProductsController.getOrderProducts";
import confirmOrder from "@salesforce/apex/OrderableProductsController.confirmOrder";
import addProducts from "@salesforce/apex/OrderableProductsController.addOrderableProducts";
import ORDER_NUMBER_FIELD from "@salesforce/schema/Order.OrderNumber";
import PRICEBOOK_ID_FIELD from "@salesforce/schema/Order.Pricebook2Id";
import STATUS_FIELD from "@salesforce/schema/Order.Status";

const columns = [
  { label: "Product name", fieldName: "Name", type: "text" },
  {
    label: "Unit Price",
    fieldName: "UnitPrice",
    type: "currency",
    typeAttributes: { currencyCode: "EUR" }
  },
  { label: "Quantity", fieldName: "Quantity", type: "decimal" },
  {
    label: "Total Price",
    fieldName: "TotalPrice",
    type: "currency",
    typeAttributes: { currencyCode: "EUR" }
  }
];

export default class OrderedProducts extends LightningElement {
  dataTable = [];
  columns = columns;
  recordsPerPage = "20";
  recordCount = 0;
  pageNumber;
  comboboxOptions = [
    { label: "20", value: "20" },
    { label: "50", value: "50" },
    { label: "100", value: "100" }
  ];
  showSpinner = false;
  @api recordId;
  openAddOrderableProductsDlg = false;
  @track isConfirmed = false;

  @wire(getRecord, {
    recordId: "$recordId",
    fields: [ORDER_NUMBER_FIELD, PRICEBOOK_ID_FIELD, STATUS_FIELD],
    optionalFields: []
  })
  order;

  get orderNumber() {
    return getFieldValue(this.order.data, ORDER_NUMBER_FIELD);
  }

  get orderPricebookId() {
    let pricebook2Id = getFieldValue(this.order.data, PRICEBOOK_ID_FIELD);
    //let pricebook2Id = getFieldValue(this.order.data, CONTRACT_PB_ID_FIELD);
    if (pricebook2Id === null) {
      this.fireToaster('Warning', 'There is no pricebook selected in contract.', 'warning');
    }
    return pricebook2Id;
  }

  get orderStatus() {
    let status = getFieldValue(this.order.data, STATUS_FIELD);
    console.log(status);
    if (status == "Activated") {
      this.isConfirmed = true;
    }
    return status;
  }

  handleAddProductsClick() {
    this.openAddOrderableProductsDlg = true;
  }

  handleDlgCloseAddProduct() {
    this.openAddOrderableProductsDlg = false;
  }

  // Refresh items pages.
  handlePageChange() {
    this.showSpinner = true;
    getOrderProducts({
      orderId: this.recordId,
      pageSize: parseInt(this.recordsPerPage)
    })
      .then((result) => {
        this.dataTable = new Array();
        this.recordCount = result.length;
        // parse results to fit in the datatable
        for (let i = 0; i < result.length; i++) {
          let row = {
            Id: result[i]["Id"],
            PricebookEntryId: result[i]["PricebookEntryId"],
            Name: result[i]["Product2"]["Name"],
            UnitPrice: result[i]["UnitPrice"],
            Quantity: result[i]["Quantity"],
            TotalPrice: result[i]["TotalPrice"]
          };
          this.dataTable = [...this.dataTable, row];
        }
        this.error = undefined;
        this.showSpinner = false;
      })
      .catch((error) => {
        this.showSpinner = false;
        this.dataTable = new Array();
        this.error = error;
        console.log(error);
      });
  }

  handlePageSize(event) {
    this.recordsPerPage = event.detail.value;
    this.handlePageChange();
  }

  handleOnProductsAdded(event) {
    this.showSpinner = true;
    let prodSelString = event.detail;
    console.log(prodSelString);
    let productsSelected = JSON.parse(prodSelString);
    this.updateTable(productsSelected);

    addProducts({ pricebookItems: prodSelString, orderId: this.recordId })
      .then(() => {
        console.log("finished 0");
        getRecordNotifyChange([{ recordId: this.recordId }]);
        this.error = undefined;
        this.showSpinner = false;
        this.fireToaster(
          "Success!",
          "Products has been added to the order",
          "success"
        );
      })
      .catch((error) => {
        this.error = error;
        console.log(error);
        this.fireToaster("Error", error.body.message, "error");
        this.showSpinner = false;
      });
  }

  updateTable(tableItems) {
    // update existing ones ...
    let dtWorkingCopy = [...this.dataTable];

    for (var i = 0; i < dtWorkingCopy.length; i++) {
      for (var j = 0; j < tableItems.length; j++) {
        if (dtWorkingCopy[i]["PricebookEntryId"] === tableItems[j]["Id"]) {
          let intVal = parseInt(dtWorkingCopy[i]["Quantity"]) + 1;
          dtWorkingCopy[i]["Quantity"] = intVal.toString();
          if (intVal > 1) {
            let listPrice = parseInt(dtWorkingCopy[i]["UnitPrice"]);
            let totalPrice = intVal * listPrice;
            dtWorkingCopy[i]["TotalPrice"] = totalPrice.toString();
          }
          tableItems[j]["_mark"] = true;
          break;
        }
      }
    }
    // Add new ones ...
    for (let i = 0; i < tableItems.length; i++) {
      if (!tableItems[i].hasOwnProperty("_mark")) {
        dtWorkingCopy = [
          ...dtWorkingCopy,
          {
            Id: new Date().getUTCMilliseconds().toString(),
            PricebookEntryId: tableItems[i]["Id"],
            Name: tableItems[i]["Name"],
            UnitPrice: tableItems[i]["UnitPrice"],
            Quantity: "1",
            TotalPrice: tableItems[i]["UnitPrice"]
          }
        ];
      }
    }
    this.dataTable = [...dtWorkingCopy];
    this.recordCount = this.dataTable.length;
    return;
  }

  handleConfirmOrder() {
    this.showSpinner = true;
    confirmOrder({ orderId: this.recordId })
      .then(() => {
        getRecordNotifyChange([{ recordId: this.recordId }]);
        this.showSpinner = false;
        this.isConfirmed = true;
        console.log(this.orderStatus);
        this.fireToaster("Success", "The order has been confirmed", "success");
      })
      .catch((error) => {
        this.showSpinner = false;
        this.isConfirmed = false;
        this.fireToaster("Error", error.body.message, "error");
      });
  }

  // fires the toaster
  fireToaster(pTitle, pMessage, pVariant) {
    const toasty = new ShowToastEvent({
      title: pTitle,
      message: pMessage,
      variant: pVariant,
      mode: "dismissable"
    });
    this.dispatchEvent(toasty);
  }

  // eslint-disable-next-line @lwc/lwc/no-async-await
  async connectedCallback() {
    if (this.scriptInitialized) {
      return;
    }
    this.scriptInitialized = true;
    this.handlePageChange();
  }
}
