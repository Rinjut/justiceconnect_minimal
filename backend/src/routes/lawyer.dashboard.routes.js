const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const CaseRequest = require("../models/CaseRequest");
const Lawyer = require("../models/Lawyer");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/lawyer/dashboard
router.get("/lawyer/dashboard", requireAuth, requireRole("lawyer"), async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.json({ count: 0, items: [], grouped: {}, lastUpdated: null });
    }

    // Resolve lawyer profile for this user
    let lawyerProfile = await Lawyer.findOne({ userId }).lean();
    if (!lawyerProfile && req.session.user?.email) {
      lawyerProfile = await Lawyer.findOne({ email: req.session.user.email }).lean();
    }
    const lawyerObjectId = lawyerProfile?._id;

    // Build match: primary -> assignedLawyer matches lawyer profile _id; fallback -> matches userId directly (legacy data)
    const matchOr = [];
    if (lawyerObjectId) {
      matchOr.push(
        { assignedLawyer: lawyerObjectId },
        { assignedLawyer: new mongoose.Types.ObjectId(String(lawyerObjectId)) }
      );
    }
    matchOr.push(
      { assignedLawyer: userId },
      { assignedLawyer: new mongoose.Types.ObjectId(String(userId)) }
    );

    const matchQuery = { $or: matchOr };

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
