import axios from "axios";
import { ApiError } from "../../utils/apiError.js";
import TempBookingTicket from "../../models/TempBooking.js";
import crypto from "crypto";


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
        InvoiceValue: 1,
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


// ---------------- Helper ----------------
function formatDate(dateObj) {
  if (!dateObj) return null;

  // If already a string, try normal parsing
  if (typeof dateObj === "string") {
    const d = new Date(dateObj);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  }

  // Handle object { day, month, year }
  if (typeof dateObj === "object" && dateObj.day && dateObj.month && dateObj.year) {
    const { day, month, year } = dateObj;
    // Pad month/day with leading zeros
    const isoStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  }

  return null;
}

function transformTravelers(travelersFromDb) {
  return travelersFromDb.map((t, index) => ({
    id: (index + 1).toString(), // Amadeus requires string id
    dateOfBirth: formatDate(t.dateOfBirth),
    name: {
      firstName: t.firstName,
      lastName: t.lastName,
    },
    gender: t.gender?.toUpperCase() || "MALE",
    contact: {
      emailAddress: t.email,
      phones: [
        {
          deviceType: "MOBILE",
          countryCallingCode: t.phoneCode?.replace("+", "") || "20",
          number: t.phoneNumber,
        },
      ],
    },
    documents: [
      {
        documentType: "PASSPORT",
        number: t.passportNumber,
        expiryDate: formatDate(t.passportExpiry),
        issuanceCountry: t.issuanceCountry, // ISO code
        nationality: t.nationality, // ISO code
        holder: true,
      },
    ],
  }));
}

export const PaymentWebhook = async (req, res) => {
  try {
    const secret = process.env.MYFATOORAH_WEBHOOK_SECRET;
    const signature = req.headers["myfatoorah-signature"];
    const { Data, Event } = req.body;

    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }
    if (!Data?.Invoice || !Data?.Transaction) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 🔹 Build signature string as per docs
    const fields = [
      `Invoice.Id=${Data.Invoice.Id || ""}`,
      `Invoice.Status=${Data.Invoice.Status || ""}`,
      `Transaction.Status=${Data.Transaction.Status || ""}`,
      `Transaction.PaymentId=${Data.Transaction.PaymentId || ""}`,
      `Invoice.ExternalIdentifier=${Data.Invoice.ExternalIdentifier || ""}`,
    ];
    const dataString = fields.join(",");

    // 🔹 Compute expected signature
    const expectedSignature = crypto
      .createHmac("sha256", Buffer.from(secret, "utf8"))
      .update(dataString, "utf8")
      .digest("base64");

    console.log("🔹 Raw body:", JSON.stringify(req.body));
    console.log("🔹 Signature string:", dataString);
    console.log("🔹 Signature from header:", signature);
    console.log("🔹 Expected signature:", expectedSignature);

    if (signature !== expectedSignature) {
      console.error("⚠️ Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
    console.log("✅ Webhook verified");

    // 🔹 Extract details
    const InvoiceId = Data.Invoice.Id;
    const InvoiceStatus = Data.Invoice.Status;
    const TransactionStatus = Data.Transaction.Status;

    if (!InvoiceId) {
      return res.status(400).json({ error: "Missing InvoiceId" });
    }

    // Handle statuses
    if (TransactionStatus === "AUTHORIZE") {
      const tempBooking = await TempBookingTicket.findOne({ invoiceId: InvoiceId });

      if (!tempBooking) {
        console.error("No booking data found for invoice:", InvoiceId);
        return res.status(404).json({ error: "Booking not found" });
      }

      try {
        const rawBooking = tempBooking.bookingData;
        const transformedTravelers = transformTravelers(rawBooking.travelers);

        const bookingPayload = {
          flightOffer: rawBooking.flightOffer,
          travelers: transformedTravelers,
          ticketingAgreement: rawBooking.ticketingAgreement || {},
        };

        const response = await axios.post(
          `${process.env.BASE_URL}/flights/flight-booking`,
          bookingPayload
        );

        if (response.status === 201) {
          await axios.post(`${process.env.BASE_URL}/payment/captureAmount`, {
            Key: InvoiceId,
            KeyType: "InvoiceId",
          });
          console.log("✅ Booking success, payment captured:", InvoiceId);
        } else {
          await axios.post(`${process.env.BASE_URL}/payment/releaseAmount`, {
            Key: InvoiceId,
            KeyType: "InvoiceId",
          });
          console.log("❌ Booking failed, payment released:", InvoiceId);
        }
      } catch (err) {
        console.error("Booking API failed:", err?.response?.data || err.message);
        await axios.post(`${process.env.BASE_URL}/payment/releaseAmount`, {
          Key: InvoiceId,
          KeyType: "InvoiceId",
        });
      }

      await TempBookingTicket.deleteOne({ invoiceId: InvoiceId });
    }

    if (TransactionStatus === "FAILED") {
      console.log("❌ Payment failed for invoice:", InvoiceId);
    }

    return res.status(200).json({ message: "Webhook processed" });
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Server error" });
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
