const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require("dotenv").config();

app.post("/api-callback", async (req, res) => {
  const { nama, email, whatsapp } = req.body;

  if (!nama || !email || !whatsapp) {
    return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
  }

  try {
    console.log("📦 Data yang dikirim ke Tripay:", {
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
    });

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
    console.error("Tripay Error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, message: "Gagal membuat transaksi", detail: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Tripay Checkout Backend Aktif");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server jalan di port", PORT));
