const axios = require('axios');

const paystack = () => {
  const mySecretKey = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;

  const initializePayment = async (form) => {
    try {
      const response = await axios.post("https://api.paystack.co/transaction/initialize", form, {
        headers: {
          authorization: mySecretKey,
          "content-type": "application/json",
          "cache-control": "no-cache",
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error initializing payment:', error);
      return { success: false, error: error.response ? error.response.data : error.message };
    }
  };

  return { initializePayment };
};

module.exports = paystack;
