const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const CaseRequest = require('../models/CaseRequest');

function priorityBadge(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u === 'high')   return { label: 'High', class: 'bg-warning' };
  if (u === 'medium') return { label: 'Medium', class: 'text-bg-primary' };
  return { label: 'Low', class: 'bg-success' };
}

function makeCaseInsensitiveRegexes(list) {
  return (list || []).map(s => {
    const esc = String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${esc}$`, 'i');
  });
}

router.get('/cases/queue', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // default statuses to show in queue
    const defaultStatuses = ['submitted', 'in review', 'assigned'];

    let statuses = req.query.status
      ? req.query.status.split(',').map(s => s.trim()).filter(Boolean)
      : defaultStatuses;

    if (statuses.length === 1 && statuses[0].toLowerCase() === 'all') {
      statuses = ['submitted', 'in review', 'assigned', 'waiting', 'pending', 'closed'];
    }

    const limit  = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    // case-insensitive filter for status values saved with different casing
    const statusRegexes = makeCaseInsensitiveRegexes(statuses);
    const query = statusRegexes.length ? { status: { $in: statusRegexes } } : {};

    const [items, total] = await Promise.all([
      CaseRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        // ⬅ include preferredName and safetyConcern so we can decide what to display
        .select('caseId status urgency province issueCategory preferredName safetyConcern updatedAt')
        .lean(),
      CaseRequest.countDocuments(query),
    ]);

    const mapped = items.map(i => {
      // If safetyConcern is true, default to anonymized label
      const canShowName = i.preferredName && !i.safetyConcern;
      const survivorLabel = canShowName ? i.preferredName : 'Anonymous Survivor';
      const survivorSub   = `${i.province || '—'} • ${i.issueCategory || '—'}`;
      const pr            = priorityBadge(i.urgency);

      return {
        caseId: i.caseId || '—',
        status: i.status || 'Submitted',
        urgency: pr, // {label,class} for your badge renderer
        survivorLabel,
        survivorSub,
        updatedAt: i.updatedAt,
      };
    });

    res.json({ total, items: mapped, limit, offset });
  } catch (err) {
    console.warn('Admin queue error:', err);
    res.status(500).json({ message: 'Failed to load assignment queue' });
  }
});

module.exports = router;
