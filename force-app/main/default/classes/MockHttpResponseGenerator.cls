@isTest
global class MockHttpResponseGenerator implements HttpCalloutMock {
  protected Integer code;

  public MockHttpResponseGenerator(Integer code) {
    this.code = code;
  }

  public HTTPResponse respond(HTTPRequest req) {
    HttpResponse resp = new HttpResponse();
    resp.setStatusCode(code);
    return resp;
  }
}
