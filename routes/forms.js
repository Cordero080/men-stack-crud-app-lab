// routes/forms.js
const express = require('express');
const router = express.Router();
const Form = require('../models/Form');

// helper for /new dropdown
async function getNameList() {
  const docs = await Form.find({}).sort({ name: 1 }).select('name -_id');
  return docs.map(d => d.name);
}

/* CREATE */
// /new
router.get('/new', async (req, res) => {
  try {
    const names = await getNameList();
    res.render('new', { title: 'Add New Martial Arts Form', names });
  } catch (e) {
    res.render('new', { title: 'Add New Martial Arts Form', names: [] });
  }
});

// POST /forms
router.post('/forms', async (req, res) => {
  try {
    const { name, rankType, rankNumber, beltColor, category, description, referenceUrl } = req.body;

    // friendly duplicate check
    const exists = await Form.exists({ name, rankType, rankNumber: Number(rankNumber) });
    if (exists) {
      const names = await getNameList();
      return res.status(400).render('new', {
        title: 'Add New Martial Arts Form',
        error: 'That form already exists for this rank.',
        names,
      });
    }

    await Form.create({
      name,
      rankType,
      rankNumber: Number(rankNumber),
      beltColor: beltColor || undefined,
      category: category || 'Kata',
      description: description || '',
      referenceUrl: referenceUrl || undefined,
      learned: false,
    });

    res.redirect('/forms');
  } catch (err) {
    const names = await getNameList();
    res.status(400).render('new', {
      title: 'Add New Martial Arts Form',
      error: err.code === 11000 ? 'Duplicate: that name/rank combo already exists.' : err.message,
      names,
    });
  }
});

/* READ */
// GET /forms
router.get('/forms', async (_req, res) => {
  try {
    const forms = await Form.find({}).sort({ rankType: 1, rankNumber: 1, name: 1 });
    res.render('forms/index2', { title: 'All Forms', forms });
  } catch {
    res.status(500).send('Failed to load forms');
  }
});

// GET /forms/:id
router.get('/forms/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).send('Form not found');
    res.render('forms/show', { title: form.name, form });
  } catch {
    res.status(404).send('Form not found');
  }
});

/* UPDATE */
// GET /forms/:id/edit
router.get('/forms/:id/edit', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).send('Form not found');
    res.render('forms/edit', { title: `Edit: ${form.name}`, form });
  } catch {
    res.status(404).send('Form not found');
  }
});

// PUT /forms/:id
router.put('/forms/:id', async (req, res) => {
  try {
    const { name, rankType, rankNumber, beltColor, category, description, referenceUrl, learned } = req.body;
    await Form.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          rankType,
          rankNumber: Number(rankNumber),
          beltColor: beltColor || undefined,
          category: category || 'Kata',
          description: description || '',
          referenceUrl: referenceUrl || undefined,
          learned: learned === 'on',
        },
      },
      { new: true, runValidators: true }
    );
    res.redirect(`/forms/${req.params.id}`);
  } catch {
    res.status(400).send('Failed to update form');
  }
});

/* DELETE (hard) */
// DELETE /forms/:id
router.delete('/forms/:id', async (req, res) => {
  try {
    await Form.findByIdAndDelete(req.params.id);
    res.redirect('/forms');
  } catch {
    res.status(400).send('Failed to delete form');
  }
});

module.exports = router;
