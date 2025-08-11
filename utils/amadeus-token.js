import axios from 'axios';

export const getAmadeusToken = async () => {
  try {
    const clientId = process.env.AMADEUS_API_KEY;
    const clientSecret = process.env.AMADEUS_API_SECRET;
    const baseUrl = process.env.AMADEUS_BASE_URL;
    const guest_office_id = process.AMADUS_GUEST_OFFICE_ID;

    if (!clientId || !clientSecret) {
      throw new Error("Amadeus Client ID or Secret is not set in environment variables.");
    }
    
    const payload = new URLSearchParams();
    payload.append("grant_type", "client_credentials");
    payload.append("client_id", clientId);
    payload.append("client_secret", clientSecret);
    // payload.append("guest_office_id", guest_office_id);

    const response = await axios.post(
      `${baseUrl}/v1/security/oauth2/token`,
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in } = response.data;

    console.log("Access token retrieved:", access_token);
    console.log(`Token expires in ${expires_in} seconds.`);

    return access_token;
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error("Error retrieving Amadeus token:", errorMessage);
    throw new Error("Failed to authenticate with Amadeus API.");
  }
};
