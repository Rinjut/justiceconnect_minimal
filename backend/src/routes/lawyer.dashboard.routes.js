const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const CaseRequest = require("../models/CaseRequest");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/lawyer/dashboard
router.get("/lawyer/dashboard", requireAuth, requireRole("lawyer"), async (req, res) => {
  try {
    const lawyerId = req.session.user?.id;

    if (!lawyerId) {
      return res.json({ count: 0, items: [], grouped: {}, lastUpdated: null });
    }

    // Match both string + ObjectId
    const matchQuery = {
      $or: [
        { assignedLawyer: lawyerId },
        { assignedLawyer: new mongoose.Types.ObjectId(lawyerId) }
      ]
    };

    const docs = await CaseRequest.find(matchQuery).lean();

    const grouped = {
      new: docs.filter(c => c.status?.toLowerCase() === "submitted").length,
      inProgress: docs.filter(c => c.status?.toLowerCase() === "in progress").length,
      nearing: docs.filter(c => c.status?.toLowerCase() === "assigned").length,
    };

    res.json({
      count: docs.length,
      lastUpdated: docs.length ? docs[0].updatedAt : null,
      grouped,
      items: docs
    });
  } catch (err) {
    console.error("❌ Lawyer Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
