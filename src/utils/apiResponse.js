//This is a standardized API response class that creates consistent, structured responses
//for your API endpoints. It ensures all successful API responses follow the same format.
class apiResponse {
  //If you call new apiResponse(200, "Success") without data, data will be null
  constructor(status, message, data = null) {
    this.status = status;
    this.message = message;
    this.data = data;
    //Automatically determines success based on status code
    // status < 400 → true (success)
    // status >= 400 → false (error)
    this.success = status < 400;
  }
}
/*
{
    status: number,
    message: string,
    data: any,
    success: boolean
}
*/

/*
Informational responses (100 – 199)
Successful responses (200 – 299)
Redirection messages (300 – 399)
Client error responses (400 – 499)
Server error responses (500 – 599)
*/

/**
 ->Frontend always knows the structure

 fetch('/api/user/123')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log(data.data); // actual user data
        }
    });
 */
