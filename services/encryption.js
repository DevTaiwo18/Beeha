const bcrypt = require('bcryptjs');

const encryptString = async (plainText, saltRounds) => {
  return await bcrypt.hash(plainText, saltRounds);
};

module.exports = { encryptString };
