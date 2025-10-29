const router = require('express').Router();
const Intake = require('../models/Intake');
const Case = require('../models/Case');
const Availability = require('../models/Availability');

function requireRole(...roles){
  return (req,res,next)=>{
    const u = req.session.user;
    if(!u) return res.status(401).json({message:'Unauthorized'});
    if(roles.length && !roles.includes(u.role)) return res.status(403).json({message:'Forbidden'});
    next();
  };
}

// UC3: Survivor submits intake
router.post('/survivor/intake', requireRole('survivor'), async (req,res)=>{
  const { needCategory, narrative } = req.body;
  const doc = await Intake.create({ survivor: req.session.user.id, needCategory, narrative });
  res.json({ id: doc._id, message:'Request submitted' });
});

// UC4: Admin assigns case
router.post('/admin/assign', requireRole('admin'), async (req,res)=>{
  const { survivorId, lawyerId, intakeId } = req.body;
  const c = await Case.create({ survivor: survivorId, lawyer: lawyerId, intake: intakeId, status:'assigned' });
  res.json({ id: c._id, message:'Case assigned' });
});

// UC5: Lawyer availability + view cases
router.post('/lawyer/availability', requireRole('lawyer'), async (req,res)=>{
  const { slots=[] } = req.body;
  const doc = await Availability.findOneAndUpdate(
    { user: req.session.user.id }, { user: req.session.user.id, slots }, { upsert: true, new: true }
  );
  res.json(doc);
});

router.get('/lawyer/cases', requireRole('lawyer'), async (req,res)=>{
  const list = await Case.find({ lawyer: req.session.user.id }).sort('-createdAt');
  res.json(list);
});

// UC6: Donor impact (anonymized counts)
router.get('/donor/impact', requireRole('donor','admin'), async (req,res)=>{
  const agg = await Case.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ summary: agg });
});

module.exports = router;
