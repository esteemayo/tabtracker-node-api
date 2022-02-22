const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./customApiError');

class UnathenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.statusCode = StatusCodes.UNAUTHORIZED;
    this.status = 'fail';
  }
}

module.exports = UnathenticatedError;
