//A function that takes another function as a parameter
//Returns a new function
// bcoz of this we dont need to put everything
// again and again in try catch block or in promise .catch
const asyncHandler = (requestHandler) => {
  //First arrow function:
  //Takes requestHandler (your async function)
  return (req, res, next) => {
    //Express Middleware Pattern
    //Second arrow function: Returns a new Express
    //middleware function with (req, res, next) parameters
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    //Wraps the result in a Promise (even if it's not already a promise)
    // Ensures consistent Promise handling
  };
};
/**
 how it works:
 No try-catch needed!
 app.get('/user', asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    res.json(user);
    // If any error occurs, asyncHandler catches it automatically
  }));
 */

export { asyncHandler };

//----------------Second APPROCH-------------------
// we got a func as a paremeter and then further down the line
// passed it to another function
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };
