import axios from "axios";
import { ApiError } from "../../utils/apiError.js"

export const InitiateSession = async (req, res, next) => {

  try {
    const paymentBaseUrl = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;
    const resposne = await axios.post(`${paymentBaseUrl}/v2/InitiateSession`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    res.status(200).json({ data: resposne.data, status: resposne.status });

  } catch (error) {
    console.error('My Fatoorah InitiateSession Error:', error.message);
    return next(new ApiError(500, 'Internal Server Error'));
  }
}

// controllers/payment/payment.controller.js
export const ExecutePayment = async (req, res, next) => {
  try {
    const { sessionId, invoiceValue } = req.body;       // only these two!
    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;

    const { data } = await axios.post(
      `${apiBase}/v2/ExecutePayment`,
      {
        SessionId: sessionId,
        // PaymentMethodId: 2,
        InvoiceValue: 1,           // e.g. 100
        ProcessingDetails: {
          AutoCapture: false,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // data.Data.PaymentURL  ==> pass this to the browser
    res.status(200).json(data);
  } catch (err) {
    console.error('ExecutePayment error:', err?.response?.data || err.message);
    next(new ApiError(500, 'ExecutePayment failed'));
  }
};


export const GetPaymentStatus = async (req, res, next) => {
  try {
    const { key, keyType } = req.body; // keyType can be 'InvoiceId' or 'PaymentId'
    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;


    const { data } = await axios.post(
      `${apiBase}/v2/GetPaymentStatus`,
      {
        Key: key,
        keyType: "InvoiceId"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json(data);
  } catch (err) {
    console.error('GetPaymentStatus error:', err?.response?.data || err.message);
    next(new ApiError(500, 'GetPaymentStatus failed'));
  }
};


export const captureAuthorizedPayment = async (req, res, next) => {
  try {
    const { Key, KeyType } = req.body; // keyType can be 'InvoiceId' or 'PaymentId'

    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;

    const { data } = await axios.post(
      `${apiBase}/v2/UpdatePaymentStatus`,
      {
        Operation: "capture",
        Amount: 1,
        Key: Key,
        KeyType: KeyType
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.status(200).json(data);
  } catch (err) {
    console.error('captureAuthorizedPayment error:', err?.response?.data || err.message);
    next(new ApiError(500, 'captureAuthorizedPayment failed'));
  }
};



export const releaseAuthorizedPayment = async (req, res, next) => {
  try {
    const { Key, KeyType } = req.body; // keyType can be 'InvoiceId' or 'PaymentId'ك

    console.log(Key, KeyType)

    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;

    const { data } = await axios.post(
      `${apiBase}/v2/UpdatePaymentStatus`,
      {
        Operation: "release",
        Amount: 1,
        Key: Key,
        KeyType: KeyType
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("released", data)
    res.status(200).json(data);
  } catch (err) {
    console.error('releaseAuthorizedPayment error:', err?.response?.data || err.message);
    next(new ApiError(500, 'releaseAuthorizedPayment failed'));
  }
};



