import axios from "axios";
import { ApiError } from "../../utils/apiError.js";
import TempBookingTicket from "../../models/TempBooking.js";

export const InitiateSession = async (req, res, next) => {
  try {
    const paymentBaseUrl = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;
    const resposne = await axios.post(
      `${paymentBaseUrl}/v2/InitiateSession`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json({ data: resposne.data, status: resposne.status });
  } catch (error) {
    console.error("My Fatoorah InitiateSession Error:", error.message);
    return next(new ApiError(500, "Internal Server Error"));
  }
};

export const ExecutePayment = async (req, res, next) => {
  try {
    const { sessionId, invoiceValue, flightData, travelers } = req.body;
    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;

    if (!sessionId || !invoiceValue || !flightData || !travelers) {
      return next(new ApiError(400, "Missing required fields"));
    }

    // Call MyFatoorah to execute the payment
    const { data } = await axios.post(
      `${apiBase}/v2/ExecutePayment`,
      {
        SessionId: sessionId,
        InvoiceValue: invoiceValue,
        ProcessingDetails: {
          AutoCapture: false, // We will capture in webhook after booking success
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const invoiceId = data?.Data?.InvoiceId;
    if (!invoiceId) {
      return next(new ApiError(500, "No InvoiceId returned from MyFatoorah"));
    }

    // Save temporary booking data to DB
    await TempBookingTicket.create({
      invoiceId,
      bookingData: {
        flightOffer: flightData,
        travelers: travelers,
      },
    });

    // Send Payment URL back to frontend
    res.status(200).json({
      success: true,
      paymentUrl: data?.Data?.PaymentURL,
      invoiceId,
    });
  } catch (err) {
    console.error("ExecutePayment error:", err?.response?.data || err.message);
    next(new ApiError(500, "ExecutePayment failed"));
  }
};

export const PaymentWebhook = async (req, res, next) => {
  try {

    const { InvoiceId, TransactionStatus } = req.body;

    const tempBooking = await TempBookingTicket.findOne({ invoiceId: InvoiceId });

    if (!tempBooking) {
      console.error("No booking data found for invoice:", InvoiceId);
      return res.status(404).json({ error: "Booking not found" });
    };

    if (TransactionStatus === "Authorize") {
      try {
        // Call your existing flight booking API
        const response = await axios.post(
          `${process.env.BASE_URL}/flights/flight-booking`,
          tempBooking.bookingData
        );

        if (response.status === 201) {
          // ✅ Capture payment on success
          await axios.post(`${process.env.BASE_URL}/payment/captureAmount`, {
            Key: InvoiceId,
            KeyType: "InvoiceId",
          });
          console.log("Booking success, payment captured:", InvoiceId);
        } else {
          // ❌ Release payment if booking failed
          await axios.post(`${process.env.BASE_URL}/payment/releaseAmount`, {
            Key: InvoiceId,
            KeyType: "InvoiceId",
          });
          console.log("Booking failed, payment released:", InvoiceId);
        }

      } catch (err) {
        console.error("Booking API failed, releasing payment:", err?.response?.data || err.message);

        // Release payment on error
        await axios.post(`${process.env.BASE_URL}/payment/releaseAmount`, {
          Key: InvoiceId,
          KeyType: "InvoiceId",
        });
      }
    }
    if (TransactionStatus === "Failed") {
      console.log("Payment failed for invoice:", InvoiceId);
      // Optional: mark booking failed in DB
    }

    // Cleanup: remove temp booking record
    await TempBookingTicket.deleteOne({ invoiceId: InvoiceId });

    return res.status(200).json({ message: "Webhook processed" });


  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const GetPaymentStatus = async (req, res, next) => {
  try {
    const { key, keyType } = req.body; // keyType can be 'InvoiceId' or 'PaymentId'
    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;

    const { data } = await axios.post(
      `${apiBase}/v2/GetPaymentStatus`,
      {
        Key: key,
        keyType: "InvoiceId",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(data);
  } catch (err) {
    console.error(
      "GetPaymentStatus error:",
      err?.response?.data || err.message
    );
    next(new ApiError(500, "GetPaymentStatus failed"));
  }
};

export const captureAuthorizedPayment = async (req, res, next) => {
  try {
    const { Key, KeyType } = req.body; // keyType can be 'InvoiceId' or 'PaymentId' => Amount

    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;

    const { data } = await axios.post(
      `${apiBase}/v2/UpdatePaymentStatus`,
      {
        Operation: "capture",
        Amount: 1,
        Key: Key,
        KeyType: KeyType,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.status(200).json(data);
  } catch (err) {
    console.error(
      "captureAuthorizedPayment error:",
      err?.response?.data || err.message
    );
    next(new ApiError(500, "captureAuthorizedPayment failed"));
  }
};

export const releaseAuthorizedPayment = async (req, res, next) => {
  try {
    const { Key, KeyType } = req.body; // keyType can be 'InvoiceId' or 'PaymentId'ك

    console.log(Key, KeyType);

    const apiBase = process.env.MYFATOORAH_API_URL;
    const token = process.env.MYFATOORAH_TEST_TOKEN;

    const { data } = await axios.post(
      `${apiBase}/v2/UpdatePaymentStatus`,
      {
        Operation: "release",
        Amount: 1,
        Key: Key,
        KeyType: KeyType,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("released", data);
    res.status(200).json(data);
  } catch (err) {
    console.error(
      "releaseAuthorizedPayment error:",
      err?.response?.data || err.message
    );
    next(new ApiError(500, "releaseAuthorizedPayment failed"));
  }
};
