const express = require('express');
const router = express.Router();
const { callOpenAI } = require('../openaiClient');
const { sendRfpEmail } = require('../sendEmail');
const { v4: uuidv4 } = require('uuid');

// In-memory store for demo (replace with DB in real project)
const RFP_STORE = {};
const PROPOSAL_STORE = {};
const VENDOR_STORE = {
  // sample vendor for demo; update later
  "vendor-1": { id: "vendor-1", name: "Demo Vendor", contact_email: "vendor@example.com" }
};

/**
 * POST /api/rfps
 * body: { text: "I need 20 laptops..." }
 * returns structured rfp
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });

    const system = { role: "system", content: "You are an assistant that extracts an RFP JSON from free text. Return only JSON." };
    const user = { role: "user", content:
      `Extract a JSON with keys: title, items (array of {name, qty, specs}), budget {amount,currency}, delivery {within_days}, payment_terms, warranty, notes. Request:\n\n${text}`
    };
    const aiText = await callOpenAI([system, user]);
    let parsed = {};
    try {
      parsed = JSON.parse(aiText);
    } catch (e) {
      // If parse fails, return raw aiText for troubleshooting
      return res.status(500).json({ error: "Failed to parse LLM response", aiText });
    }

    const id = uuidv4();
    const rfp = { id, raw_text: text, structured: parsed, created_at: new Date().toISOString() };
    RFP_STORE[id] = rfp;
    return res.json(rfp);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rfps/:id/send
 * body: { vendorId: "vendor-1", message: "optional" }
 */
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId, message } = req.body;
    const rfp = RFP_STORE[id];
    if (!rfp) return res.status(404).json({ error: "RFP not found" });
    const vendor = VENDOR_STORE[vendorId];
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    // Build a simple email body
    const emailBody = `
      Hello ${vendor.name},

      Please find RFP details below:

      ${JSON.stringify(rfp.structured, null, 2)}

      ${message || ""}

      Please reply to this email with your proposal and include RFP-ID: ${id}
    `;
    const info = await sendRfpEmail(vendor.contact_email, `RFP: ${rfp.structured.title || 'Procurement'} -- RFP-ID:${id}`, emailBody);
    return res.json({ success: true, messageId: info.messageId || info });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rfps/:id/inbound (simulate an inbound vendor email for demo)
 * body: { vendorId, subject, body }
 */
router.post('/:id/inbound', async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId, subject, body } = req.body;
    const rfp = RFP_STORE[id];
    if (!rfp) return res.status(404).json({ error: "RFP not found" });
    const vendor = VENDOR_STORE[vendorId];
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    // Build prompt for parsing vendor response
    const system = { role: "system", content: "You are an assistant that extracts structured proposal info from vendor email text. Return only JSON." };
    const user = { role: "user", content:
      `RFP: ${JSON.stringify(rfp.structured)}\n\nVendor email subject: ${subject}\n\nVendor email body:\n${body}\n\nReturn JSON: vendor_name, line_items[{description, qty, unit_price, currency, total}], subtotal, tax, shipping, grand_total, delivery {within_days}, warranty, payment_terms, notes`
    };
    const aiText = await callOpenAI([system, user]);
    let parsed = {};
    try {
      parsed = JSON.parse(aiText);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse LLM response", aiText });
    }

    const pid = uuidv4();
    PROPOSAL_STORE[pid] = { id: pid, rfpId: id, vendorId, raw_email: body, parsed, created_at: new Date().toISOString() };
    return res.json(PROPOSAL_STORE[pid]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/rfps/:id/proposals — list proposals for RFP (demo)
 */
router.get('/:id/proposals', (req, res) => {
  const { id } = req.params;
  const list = Object.values(PROPOSAL_STORE).filter(p => p.rfpId === id);
  res.json(list);
});

module.exports = router;
