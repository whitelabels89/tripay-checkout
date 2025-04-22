const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("✅ Tripay Checkout Backend Aktif");
});

app.post("/create-checkout", async (req, res) => {
  const { nama, email, whatsapp } = req.body;

  if (!nama || !email || !whatsapp) {
    return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
  }

  try {
    const response = await axios.post(
      "https://tripay.co.id/api/transaction/create",
      {
        method: "QRIS",
        merchant_ref: "QCEB1-" + Date.now(),
        amount: 15000,
        customer_name: nama,
        customer_email: email,
        customer_phone: whatsapp,
        order_items: [
          {
            sku: "QCEB1",
            name: "QCEB1 Master Prompt",
            price: 15000,
            quantity: 1,
          },
        ],
        callback_url: process.env.CALLBACK_URL,
        return_url: process.env.RETURN_URL
      },
      {
        headers: {
          Authorization: "Bearer " + process.env.TRIPAY_API_KEY,
        },
      }
    );

    return res.json({ success: true, pay_url: response.data.data.checkout_url });

  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("❌ Tripay Error:", detail);
    return res.status(500).json({ success: false, message: "Gagal membuat transaksi", detail });
  }
});

app.post("/callback", async (req, res) => {
  const data = req.body;
  console.log("📩 Callback diterima:", JSON.stringify(data, null, 2));

  if (data.status === "PAID") {
    const payload = {
      reference: data.reference,
      merchant_ref: data.merchant_ref,
      payment_method: data.payment_method,
      payment_method_code: data.payment_method_code,
      total_amount: data.total_amount,
      fee_merchant: data.fee_merchant,
      fee_customer: data.fee_customer,
      amount_received: data.amount_received,
      is_closed_payment: data.is_closed_payment,
      status: data.status,
      paid_at: data.paid_at,
      note: data.note,
      timestamp_received: new Date().toISOString()
    };

    // ✅ Kirim ke Google Sheets
    try {
      await axios.post(process.env.GOOGLE_SHEET_WEBHOOK, payload);
      console.log("✅ Data dikirim ke Google Sheet");
    } catch (err) {
      console.error("❌ Gagal kirim ke Google Sheet:", err.message);
    }

    // ✅ Kirim WhatsApp via Whacenter
    try {
      const message = `Halo ${data.note || "kakak"}, terima kasih telah membeli eBook Prompt Master.\n\nBerikut link downloadnya:\nhttps://drive.google.com/file/d/1Egok1XjsWx_Ny9oCvK1ytbKUCwpk1MR8/view?usp=drive_link\n\nSalam sukses!`;
      await axios.post("https://app.whacenter.com/api/send", {
        device: process.env.WHACENTER_DEVICE,
        number: data.customer_phone || "",
        message
      });
      console.log("✅ WhatsApp dikirim via Whacenter");
    } catch (err) {
      console.error("❌ Gagal kirim WhatsApp:", err.message);
    }
  }

  res.status(200).send("Callback OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server aktif di port ${PORT}`));
