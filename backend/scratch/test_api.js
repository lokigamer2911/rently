const axios = require('axios');

async function test() {
  try {
    // We don't have a valid auth token easily here, 
    // but we can check if the route exists and how it responds to unauthorized
    const res = await axios.get('http://localhost:5000/api/listings/user/me');
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    console.error('Error status:', err.response?.status);
    console.error('Error message:', err.response?.data);
  }
}

test();
