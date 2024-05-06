const crypto = require('crypto');

const createToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { createToken };
