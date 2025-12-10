const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const CaseRequest = require("../models/CaseRequest");
const Lawyer = require("../models/Lawyer");
const { requireAuth, requireRole } = require("../middleware/auth");

async function resolveLawyerIds(sessionUser) {
  const ids = [];
  if (!sessionUser) return ids;
  const userId = sessionUser.id;
  const email = sessionUser.email;

  if (userId) {
    ids.push(userId);
    if (mongoose.Types.ObjectId.isValid(userId)) {
      ids.push(new mongoose.Types.ObjectId(userId));
    }
  }

  // Try to find the lawyer profile linked to this user or email
  let lawyerProfile = null;
  if (userId) {
    lawyerProfile = await Lawyer.findOne({ userId }).lean();
  }
  if (!lawyerProfile && email) {
    lawyerProfile = await Lawyer.findOne({ email }).lean();
  }
  if (lawyerProfile?._id) {
    ids.push(lawyerProfile._id);
    if (mongoose.Types.ObjectId.isValid(String(lawyerProfile._id))) {
      ids.push(new mongoose.Types.ObjectId(String(lawyerProfile._id)));
    }
  }

  return ids;
}

// GET /api/lawyer/case/:id → Load case details
router.get(
  "/lawyer/case/:id",
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
      console.error("Case load error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PATCH /api/lawyer/case/:id/complete
router.patch(
  "/lawyer/case/:id/complete",
  requireAuth,
  requireRole("lawyer"),
  async (req, res) => {
    try {
      const caseId = req.params.id;
      const allowedIds = await resolveLawyerIds(req.session.user);

      if (!allowedIds.length) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (!mongoose.Types.ObjectId.isValid(caseId)) {
        return res.status(400).json({ message: "Invalid case id" });
      }

      const match = {
        _id: caseId,
        assignedLawyer: { $in: allowedIds },
      };

      const updated = await CaseRequest.findOneAndUpdate(
        match,
        {
          $set: {
            status: "Closed",
            completedAt: new Date(),
          },
        },
        { new: true, runValidators: false } // avoid legacy validation failures
      );

      if (!updated) {
        return res.status(404).json({ message: "Case not found or not assigned to you" });
      }

      res.json({ message: "Case marked as completed", case: updated });
    } catch (err) {
      console.error("Complete case error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PATCH /api/lawyer/case/:id/note
router.patch(
  "/lawyer/case/:id/note",
  requireAuth,
  requireRole("lawyer"),
  async (req, res) => {
    try {
      const caseId = req.params.id;
      const allowedIds = await resolveLawyerIds(req.session.user);
      const { note = "" } = req.body || {};

      if (!allowedIds.length) {
        return res.status(401).json({ message: "Not authorized" });
      }

       // Guard against invalid ObjectId to avoid server errors
      if (!mongoose.Types.ObjectId.isValid(caseId)) {
        return res.status(400).json({ message: "Invalid case id" });
      }

      const match = {
        _id: caseId,
        assignedLawyer: { $in: allowedIds },
      };

      const updated = await CaseRequest.findOneAndUpdate(
        match,
        { $set: { internalNotes: note } },
        { new: true, runValidators: false } // don't revalidate required legacy fields
      );

      if (!updated) {
        return res.status(404).json({ message: "Case not found or not assigned to you" });
      }

      return res.json({ message: "Note saved", note: updated.internalNotes });
    } catch (err) {
      console.error("Note save error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
