import { createElement } from "lwc";
import OrderedProducts from "../orderedProducts";
// import getOrderProducts from "@salesforce/apex/OrderableProductsController.getOrderProducts";
// const APEX_ORDERITEMLIST_ERROR = require("./data/pricebookEntryLstError.json");
// const APEX_ORDERITEMLIST_SUCCESS = require("./data/pricebookEntryLst.json");

// jest.mock(
//   "@salesforce/apex/OrderableProductsController.getOrderProducts",
//   () => ({
//     default: jest.fn()
//   }),
//   { virtual: true }
// );

describe("c-ordered-products suite", () => {
  beforeEach(() => {
    const element = createElement("c-ordered-products", {
      is: OrderedProducts
    });
    element.recordId = "80117000000sa84AAA";
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


  it('Shows an order header', () => {
    const element = createElement('c-ordered-products', {
        is: OrderedProducts
    });

    element.recordId = '123123123123';
    element.pricebookId = '3';
    document.body.appendChild(element);

    const orderTitle = element.shadowRoot.querySelector('h1');
    expect(orderTitle.textContent).toBe('Order');

  });

});
