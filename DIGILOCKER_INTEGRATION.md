# 🛡️ Real DigiLocker Integration Guide

To move from our current simulation to the real Government of India API, follow these steps.

## 1. Legal & Registration (Mandatory)
Before writing code, you must be recognized as a DigiLocker Partner:
- **Register:** Go to [partners.digitallocker.gov.in](https://partners.digitallocker.gov.in/).
- **Submit Application:** You will need your Business PAN, GST (if applicable), and a brief description of why Rentrex needs this data (e.g., "Peer-to-Peer trust and theft prevention").
- **Get Keys:** Once approved, you will get:
  - `Client ID`
  - `Client Secret`
  - `Developer Key`

## 2. Technical Implementation
Once you have the keys, update your `backend/.env` and use the following OAuth2 flow.

### Step A: The Authorization Request
Redirect your users to this URL to start the login:
`https://digitallocker.gov.in/public/oauth2/1/authorize?response_type=code&client_id=YOUR_CLIENT_ID&state=123456&redirect_uri=YOUR_CALLBACK_URL`

### Step B: Token Exchange (Backend)
When the user returns, your backend must exchange their `code` for an `access_token`:
```javascript
const response = await axios.post('https://digitallocker.gov.in/public/oauth2/1/token', {
  code: authorization_code,
  grant_type: 'authorization_code',
  client_id: process.env.DIGILOCKER_CLIENT_ID,
  client_secret: process.env.DIGILOCKER_CLIENT_SECRET,
  redirect_uri: process.env.DIGILOCKER_CALLBACK_URL
});
```

### Step C: Fetching the Aadhaar XML/PDF
Use the token to fetch the actual document:
```javascript
const doc = await axios.get('https://digitallocker.gov.in/public/oauth2/1/files/issued', {
  headers: { Authorization: `Bearer ${response.data.access_token}` }
});
```

## 3. Why the "Simulation" is useful now
While you wait for your Partner Application to be approved (which can take **7-14 days**):
- **Test Checkout:** Our simulation allows you to test the checkout process, which is currently blocked for unverified users.
- **UI Testing:** You can ensure the "Verified Renter" badges and profile ticks appear correctly.
- **Investor Demo:** The simulation looks and feels like the real thing, perfect for showing the "Trust" aspect of your business to potential partners.

**When you get your real keys, let me know and I will help you swap the simulation code for the real API calls!** 🚀
