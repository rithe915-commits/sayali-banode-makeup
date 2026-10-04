// Alias endpoint for sending appointment status notifications
const sendEmailHandler = require('./send-email');

module.exports = async (req, res) => {
  if (req.body && typeof req.body === 'object') {
    req.body.type = 'status_update';
  }
  return sendEmailHandler(req, res);
};
