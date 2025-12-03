const express = require("express");
const router = express.Router();
const CaseRequest = require("../models/CaseRequest");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/lawyer/case/:id → Load case details
router.get("/lawyer/case/:id",
  requireAuth,
  requireRole("lawyer"),
  async (req, res) => {
    try {
      const caseDoc = await CaseRequest.findById(req.params.id).lean();

      if (!caseDoc) {
        return res.status(404).json({ message: "Case not found" });
      }

      res.json(caseDoc);

    } catch (err) {
      console.error("❌ Case load error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// PATCH /api/lawyer/case/:id/complete
router.patch("/lawyer/case/:id/complete", requireAuth, requireRole("lawyer"), async (req, res) => {
  try {
    const caseId = req.params.id;
    const lawyerId = req.session.user?.id;

    if (!lawyerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Only the assigned lawyer can close it
    const caseDoc = await CaseRequest.findOne({
      _id: caseId,
      assignedLawyer: lawyerId
    });

    if (!caseDoc) {
      return res.status(404).json({
        message: "Case not found or not assigned to you"
      });
    }

    // Update status → Completed
    caseDoc.status = "Completed";
    caseDoc.completedAt = new Date();
    await caseDoc.save();

    res.json({ message: "Case marked as completed", case: caseDoc });
  } catch (err) {
    console.error("❌ Complete case error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
