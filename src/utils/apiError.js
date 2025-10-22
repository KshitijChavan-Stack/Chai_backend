//This is a common pattern in Node.js/Express
//applications for creating standardized error responses!
class apiError extends Error {
  //Allows us to throw this like
  //a regular error: throw new apiError(...)
  constructor(
    //Special method that runs when
    //you create a new instance: new apiError(...)
    message = "something went wrong",
    statusCode,
    errors = [],
    stack = ""
  ) {
    this.super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // if have stack or not
    if (stack) {
      this.stack = stack;
    } else {
      //Else: Generate a stack trace
      //automatically using Error.captureStackTrace()
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };
