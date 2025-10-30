// backend/src/routes/cases.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const CaseRequest = require('../models/CaseRequest');

// Auth guard
function mustBeLoggedIn(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Not logged in' });
  next();
}

// Upload config (/uploads)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^\w.\-]/g, '_');
    cb(null, safe);
  }
});

const allowed = new Set([
  'application/pdf',
  'text/plain',
  'application/rtf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg','image/png','image/gif','image/webp','image/heic'
]);

function fileFilter(_req, file, cb) {
  if (allowed.has(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type: ' + file.mimetype), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { files: 5, fileSize: 10 * 1024 * 1024 }, // 5 files, 10MB each
});

// Validators
const validateCreate = [
  body('preferredName').trim().notEmpty().withMessage('Preferred name is required'),
  body('contactMethod').isIn(['email','phone','sms','in-app']).withMessage('Select a contact method'),
  body('province').trim().notEmpty().withMessage('Province is required'),
  body('issueCategory').trim().notEmpty().withMessage('Issue category is required'),
  body('situation').trim().notEmpty().withMessage('Please describe your situation'),
  body('urgency').isIn(['Low','Medium','High']).withMessage('Please choose urgency'),
];

// Generate human-friendly caseId (JC-YYYY-###)
async function nextCaseId() {
  const year = new Date().getFullYear();
  const prefix = `JC-${year}-`;
  const last = await CaseRequest.findOne({ caseId: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select('caseId')
    .lean();
  let n = 1;
  if (last?.caseId) {
    const m = last.caseId.match(/-(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return prefix + String(n).padStart(3, '0');
}

// POST /api/cases/request
router.post(
  '/request',
  mustBeLoggedIn,
  upload.array('attachments', 5),
  validateCreate,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const byField = {};
      errors.array().forEach(e => { byField[e.path] = e.msg; });
      return res.status(400).json({ message: 'Validation failed', errors: byField });
    }

    try {
      const userId = req.user?._id || req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Session missing user id' });

      const files = (req.files || []).map(f => ({
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        mimeType: f.mimetype,
        path: f.path
      }));

      const doc = await CaseRequest.create({
        user: userId,

        preferredName:  req.body.preferredName,
        contactMethod:  req.body.contactMethod,
        contactValue:   req.body.contactValue || '',
        safeToContact:  String(req.body.safeToContact) === 'true',

        province: req.body.province,
        city:     req.body.city || '',
        language: req.body.language || 'English',

        issueCategory:  req.body.issueCategory,
        desiredOutcome: req.body.desiredOutcome || '',
        situation:      req.body.situation,

        urgency:       req.body.urgency,
        safetyConcern: String(req.body.safetyConcern) === 'true',

        contactTimes:      req.body.contactTimes || '',
        accessNeeds:       req.body.accessNeeds || '',
        confidentialNotes: req.body.confidentialNotes || '',

        attachments: files,
        status: 'Submitted',
        caseId: await nextCaseId(),
      });

      return res.status(201).json({
        message: 'Your request has been submitted.',
        caseId: doc.caseId
      });

    } catch (err) {
      console.warn('Case request error:', err);
      return res.status(500).json({ message: 'Server error.' });
    }
  }
);

// GET /api/cases/mine
router.get('/mine', mustBeLoggedIn, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Session missing user id' });

    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip  = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CaseRequest.find({ user: userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('caseId status situation desiredOutcome updatedAt issueCategory')
        .lean(),
      CaseRequest.countDocuments({ user: userId })
    ]);

    res.json({ items, total, page, limit });
  } catch (err) {
    console.warn('List my cases error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/cases/latest
router.get('/latest', mustBeLoggedIn, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Session missing user id' });

    const doc = await CaseRequest.findOne({ user: userId })
      .sort({ updatedAt: -1 })
      .select('caseId status situation desiredOutcome updatedAt issueCategory')
      .lean();

    res.json({ case: doc || null });
  } catch (err) {
    console.warn('Get latest case error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
