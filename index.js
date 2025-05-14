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

  const merchantRef = "QCEB1-" + Date.now();

  try {
    // Simulasi order langsung tanpa proses pembayaran Tripay
    await axios.post(process.env.GOOGLE_SHEET_WEBHOOK, {
      reference: merchantRef,
      merchant_ref: merchantRef,
      payment_method: "SIMULASI",
      payment_method_code: "SIMULASI",
      total_amount: 15000,
      fee_merchant: 0,
      fee_customer: 0,
      amount_received: 15000,
      is_closed_payment: true,
      status: "PAID",
      paid_at: new Date().toISOString(),
      note: nama,
      customer_email: email,
      customer_phone: whatsapp,
      timestamp_received: new Date().toISOString()
    });

    await axios.post("https://app.whacenter.com/api/send", {
      device: process.env.WHACENTER_DEVICE,
      number: whatsapp,
      message: `Halo ${nama}, terima kasih telah membeli eBook Prompt Master!\n\nBerikut link download:\nhttps://drive.google.com/file/d/1Egok1XjsWx_Ny9oCvK1ytbKUCwpk1MR8/view?usp=drive_link\n\nSalam sukses!`
    });

    return res.json({ success: true, message: "eBook berhasil dikirim!" });
  } catch (err) {
    console.error("❌ Gagal kirim data simulasi:", err.message);
    return res.status(500).json({ success: false, message: "Gagal proses simulasi pembelian." });
  }
});

app.get("/", (req, res) => {
  res.send("Tripay Checkout Backend Aktif");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server jalan di port", PORT));
