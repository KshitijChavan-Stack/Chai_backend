class apiResponse {
  constructor(status, message, data = null) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success = status < 400;
  }
}
/*
Informational responses (100 – 199)
Successful responses (200 – 299)
Redirection messages (300 – 399)
Client error responses (400 – 499)
Server error responses (500 – 599)
*/
