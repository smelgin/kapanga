/**
 * addOrderableProducts
 * Object: Add orderable products to the current order.
 * Events fired:
 * - productsAdded
 * - dlgClose
 * @author: Ernesto S Melgin <esmelgin@gmail.com>
 */
import { LightningElement, track, api } from "lwc";
import getProducts from "@salesforce/apex/OrderableProductsController.search";

const columns = [
  { label: "Product name", fieldName: "Name", type: "text" },
  {
    label: "Unit Price",
    fieldName: "UnitPrice",
    type: "currency",
    typeAttributes: { currencyCode: "EUR" }
  }
];

const EVENT_CLOSE_DLG = "close";
const EVENT_PRODUCTS_ADDED = "products";

export default class AddOrderableProducts extends LightningElement {
  scriptInitialized = false; // used for controlling connectedCallback();
  dataTable = [];
  selectedItems = {};
  columns = columns;
  error;
  recordsPerPage = "20";
  comboboxOptions = [
    { label: "20", value: "20" },
    { label: "50", value: "50" },
    { label: "100", value: "100" }
  ];
  queryTerm;
  @track showSpinner = false;
  @api orderId;
  @api pricebookId;

  getSelectedName(event) {
    const selectedRows = event.detail.selectedRows;
    if (this.selectedItems === null) {
      this.selectedItems = {};
    }
    // Display that fieldName of the selected rows
    for (let i = 0; i < selectedRows.length; i++) {
      // use an object as an indexed array
      this.selectedItems[selectedRows[i].Id] = {
        Id: selectedRows[i].Id,
        Name: selectedRows[i].Name,
        UnitPrice: selectedRows[i].UnitPrice
      };
    }
  }

  handleKeyUp(evt) {
    const isEnterKey = evt.keyCode === 13;
    if (isEnterKey) {
      this.queryTerm = evt.target.value;
      this.handleSearch();
    }
  }

  handleAddProducts() {
    if (typeof this.selectedItems === "object" && this.selectedItems !== null) {
      // Add the selected products to the current order.
      let arrConverted = new Array();
      for (const prop in this.selectedItems) {
        arrConverted = [...arrConverted, this.selectedItems[prop]];
      }
      let productsSelected = JSON.stringify(arrConverted);
      this.dispatchEvent(
        new CustomEvent(EVENT_PRODUCTS_ADDED, { detail: productsSelected })
      );
    }
    this.selectedItems = {};
    this.handleDlgClose();
  }

  handleDlgClose() {
    this.dispatchEvent(new CustomEvent(EVENT_CLOSE_DLG));
  }

  handlePageSize(event) {
    this.recordsPerPage = event.detail.value;
    this.handleSearch();
  }

  // Do the search of products
  handleSearch() {
    this.showSpinner = true;
    getProducts({
      searchKey: this.queryTerm,
      pricebookId: this.pricebookId,
      pageSize: parseInt(this.recordsPerPage)
    })
      .then((result) => {
        this.dataTable = new Array();
        this.selectedItems = {};
        // parse results to fit in the datatable
        for (let i = 0; i < result.length; i++) {
          let row = {
            Id: result[i]["Id"], // PricebookEntryId
            Name: result[i]["Product2"]["Name"],
            UnitPrice: result[i]["UnitPrice"],
            Product2Id: result[i]["Product2Id"]
          };
          this.dataTable = [...this.dataTable, row];
        }
        this.error = undefined;
        this.showSpinner = false;
      })
      .catch((error) => {
        this.showSpinner = false;
        this.dataTable = new Array();
        this.selectedItems = {};
        this.error = error;
        console.log(error);
      });
  }

  // eslint-disable-next-line @lwc/lwc/no-async-await
  async connectedCallback() {
    if (this.scriptInitialized) {
      return;
    }
    this.scriptInitialized = true;
    this.handleSearch();
  }
}
