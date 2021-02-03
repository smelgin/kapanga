/* eslint-disable @lwc/lwc/no-document-query */
import { createElement } from "lwc";
import AddOrderableProducts from "c/addOrderableProducts";
import search from "@salesforce/apex/OrderableProductsController.search";
const APEX_PRICEBOOKENTRY_ERROR = require("./data/pricebookEntryLstError.json");
const APEX_PRICEBOOKENTRY_SUCCESS = require("./data/pricebookEntryLst.json");

jest.mock(
  "@salesforce/apex/OrderableProductsController.search",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("c-add-orderable-products", () => {
  beforeEach(() => {
    const element = createElement("c-add-orderable-products", {
      is: AddOrderableProducts
    });
    element.orderId = "5";
    element.pricebookId = "3";
    document.body.appendChild(element);
  });

  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    // Prevent data saved on mocks from leaking between tests
    jest.clearAllMocks();
  });

  it("test modal appeareance", () => {
    const element = document.querySelector("c-add-orderable-products");
    const modalContainerElementShow = element.shadowRoot.querySelector(
      ".slds-modal__container"
    );
    expect(modalContainerElementShow.tagName).toBe("DIV");
  });

  it("test the title appears", () => {
    const HEADER = "Add Products ...";
    const element = document.querySelector("c-add-orderable-products");
    const headerEl = element.shadowRoot.querySelector("h2");
    expect(headerEl.textContent).toBe(HEADER);
  });

  it("renders pricebookList returned from imperative Apex Call", async () => {
    search.mockResolvedValue(APEX_PRICEBOOKENTRY_SUCCESS);
    await Promise.resolve();
    // debugger;

    const element2 = document.querySelector("c-add-orderable-products");
    const productListEl = element2.shadowRoot.querySelector(
        "lightning-datatable"
      )
      productListEl.dispatchEvent(new CustomEvent("rowselection", {detail : {selectedRows: [{ Id: "11231231", Name: "test1", UnitPrice: 105.00 }] }}));
      //console.log(productListEl.data);
      await Promise.resolve();
      expect(productListEl.data).toBeTruthy();

      const prodButtonEl = element2.shadowRoot.querySelector('.handleAddProducts');
      prodButtonEl.click();
  });

  it("renders the error when apex returns an error", () => {
    search.mockRejectedValue(APEX_PRICEBOOKENTRY_ERROR);

    const element = document.querySelector("c-add-orderable-products");

    const searchElem = element.shadowRoot.querySelector("lightning-button");
    searchElem.click();

    return Promise.resolve().catch(() => {
      const errorElement = element.shadowRoot.querySelector("p.error");
      expect(errorElement).not.toBeNull();
    });
  });
});
