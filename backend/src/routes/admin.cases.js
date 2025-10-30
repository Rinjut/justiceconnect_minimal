// backend/src/routes/admin.cases.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

const CaseRequest = require('../models/CaseRequest');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/admin/cases/:caseId  -> load one case by public caseId
router.get('/cases/:caseId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const doc = await CaseRequest.findOne({ caseId: req.params.caseId }).lean();
    if (!doc) return res.status(404).json({ message: 'Case not found' });

    // Normalize for UI
    const out = {
      caseId: doc.caseId,
      status: doc.status || 'Submitted',
      priority: doc.urgency || 'Medium',      // use urgency as priority for UI
      created: doc.createdAt,
      issueCategory: doc.issueCategory || '',
      description: doc.situation || '',

      preferredName: doc.preferredName || '',
      contactMethod: doc.contactMethod || '',
      contactValue: doc.contactValue || '',
      safeToContact: !!doc.safeToContact,

      province: doc.province || '',
      city: doc.city || '',
      language: doc.language || '',

      desiredOutcome: doc.desiredOutcome || '',
      situation: doc.situation || '',
      urgency: doc.urgency || '',
      safetyConcern: !!doc.safetyConcern,

      contactTimes: doc.contactTimes || '',
      accessNeeds: doc.accessNeeds || '',
      confidentialNotes: doc.confidentialNotes || '',

      // create signed/secure download urls later; for now simple local link
      attachments: (doc.attachments || []).map((f, i) => ({
        name: f.originalName || f.filename,
        url: `/api/admin/cases/${encodeURIComponent(doc.caseId)}/attachments/${encodeURIComponent(f.filename)}`
      })),

      // optional: any assignment fields you store
      assignedLawyer: doc.assignedLawyer || '',
      adminNotes: doc.adminNotes || ''
    };

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error loading case' });
  }
});

// GET /api/admin/cases/:caseId/attachments/:filename  -> stream file
router.get('/cases/:caseId/attachments/:filename', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const doc = await CaseRequest.findOne({ caseId: req.params.caseId }).lean();
    if (!doc) return res.status(404).json({ message: 'Case not found' });

    const item = (doc.attachments || []).find(a => a.filename === req.params.filename);
    if (!item) return res.status(404).json({ message: 'File not found' });

    if (!fs.existsSync(item.path)) return res.status(404).json({ message: 'File missing on server' });
    res.download(item.path, item.originalName || item.filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error downloading file' });
  }
});

// POST /api/admin/cases/:caseId/assign  -> set lawyer/priority/status/notes
router.post('/cases/:caseId/assign', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { lawyer, priority, status, notes } = req.body;

    const update = {
      assignedLawyer: lawyer || '',
      urgency: priority || 'Medium',  // keep using urgency as UI priority
      status: status || 'In Review',
      adminNotes: notes || ''
    };

    const doc = await CaseRequest.findOneAndUpdate(
      { caseId: req.params.caseId },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ message: 'Case not found' });
    res.json({ message: 'Assignment saved', caseId: doc.caseId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving assignment' });
  }
});

module.exports = router;
