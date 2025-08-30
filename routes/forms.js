const express = require("express");
const router = express.Router();
const Form = require("../models/Form");

// helper for /forms/new dropdown (alive only)
async function getNameList() {
  const docs = await Form.find({ deletedAt: null })
    .sort({ name: 1 })
    .select("name -_id");
  return docs.map((d) => d.name);
}

function formatErrors(err) {
  return Object.fromEntries(
    Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
  );
}

/* CREATE */
// GET /forms/new
router.get("/forms/new", async (req, res) => {
  try {
    const names = await getNameList();
    res.render("new", {
      title: "Add New Martial Arts Form",
      names,
      error: null,
      errors: {},
      formData: {},
    });
  } catch {
    res.render("new", {
      title: "Add New Martial Arts Form",
      names: [],
      error: null,
      errors: {},
      formData: {},
    });
  }
});

// POST /forms
router.post("/forms", async (req, res, next) => {
  try {
    const {
      name,
      rankType,
      rankNumber,
      beltColor,
      category,
      description,
      referenceUrl,
      learned,
    } = req.body;

    // Optional friendly duplicate check
    const exists = await Form.exists({
      name,
      rankType,
      rankNumber: Number(rankNumber),
      deletedAt: null, // consider only alive docs
    });
    if (exists) {
      const names = await getNameList();
      return res.status(400).render("new", {
        title: "Add New Martial Arts Form",
        error: "That form already exists for this rank.",
        errors: {},
        formData: req.body,
        names,
      });
    }

    await Form.create({
      name,
      rankType,
      rankNumber: Number(rankNumber),
      beltColor: beltColor || undefined,
      category: category || "Kata",
      description: description || "",
      referenceUrl: referenceUrl || undefined,
      learned: learned === "on",
    });

    res.redirect("/forms");
  } catch (err) {
    // 🔽 NEW: catch DB unique index violations (race-safe duplicate guard)
    if (err && err.code === 11000) {
      const names = await getNameList();
      return res.status(400).render("new", {
        title: "Add New Martial Arts Form",
        error: "That form already exists for this rank.",
        errors: {},
        formData: req.body,
        names,
      });
    }

    if (err.name === "ValidationError") {
      const names = await getNameList();
      return res.status(400).render("new", {
        title: "Add New Martial Arts Form",
        error: null,
        errors: formatErrors(err),
        formData: req.body,
        names,
      });
    }
    next(err);
  }
});

/* READ */
// GET /forms  (alive only)
router.get("/forms", async (_req, res) => {
  try {
    const forms = await Form.find({ deletedAt: null }).sort({
      rankType: 1,
      rankNumber: 1,
      name: 1,
    });
    res.render("forms/index2", { title: "All Forms", forms });
  } catch {
    res.status(500).send("Failed to load forms");
  }
});

// GET /forms/trash  (soft-deleted only)
router.get("/forms/trash", async (req, res) => {
  try {
    const forms = await Form.find({ deletedAt: { $ne: null } }).sort({
      updatedAt: -1,
    });
    res.render("forms/trash", { title: "Trash", forms });
  } catch {
    res.status(500).send("Failed to load trash");
  }
});

/* UPDATE */
// GET /forms/:id/edit   (block editing trashed)
router.get("/forms/:id/edit", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt)
      return res.status(404).send("Form not found");
    res.render("forms/edit", {
      title: `Edit: ${form.name}`,
      form,
      error: null,
      errors: {},
      formData: {},
    });
  } catch {
    res.status(404).send("Form not found");
  }
});

// PUT /forms/:id
router.put("/forms/:id", async (req, res, next) => {
  try {
    const {
      name,
      rankType,
      rankNumber,
      beltColor,
      category,
      description,
      referenceUrl,
      learned,
    } = req.body;
 //===============  ✅PREVENT DUPLICATS GUARD✅ ==================\\
const exists = await Form.exists({
  _id: { $ne: req.params.id },
  name, 
  rankType,
  rankNumber: Number(rankNumber),
  deletedAt: null,
});
if (exists) {
  const form = await Form.findById(req.params.id);
  return res.status(400).render('forms/edit', {
    title: `Edit: ${from?.name || "Form"}`,
    form,
    error: "That form already exists for this rank.",
    errors: {},
    formData: req.body,
  });
}
    const doc = await Form.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          rankType,
          rankNumber: Number(rankNumber),
          beltColor: beltColor || undefined,
          category: category || "Kata",
          description: description || "",
          referenceUrl: referenceUrl || undefined,
          learned: learned === "on",
        },
      },
      { new: true, runValidators: true }
    );

    if (!doc || doc.deletedAt) return res.status(404).send("Form not found");
    res.redirect(`/forms/${req.params.id}`);
  } catch (err) {
    if (err.name === "ValidationError") {
      const form = await Form.findById(req.params.id);
      return res.status(400).render("forms/edit", {
        title: `Edit: ${form?.name || "Form"}`,
        form,
        error: null,
        errors: formatErrors(err),
        formData: req.body,
      });
    }
    next(err);
  }
});

/* DELETE */
// DELETE /forms/:id  → SOFT delete by default, HARD delete if ?hard=1
router.delete("/forms/:id", async (req, res) => {
  try {
    const hard = req.query.hard === "1" || req.body.hard === "1";
    if (hard) {
      await Form.deleteOne({ _id: req.params.id });
      return res.redirect("/forms/trash");
    }
    await Form.updateOne(
      { _id: req.params.id },
      { $set: { deletedAt: new Date() } }
    );
    res.redirect("/forms");
  } catch {
    res.status(400).send("Failed to delete form");
  }
});

// POST /forms/:id/restore  (undo soft delete)
router.post("/forms/:id/restore", async (req, res) => {
  try {
    await Form.updateOne(
      { _id: req.params.id },
      { $set: { deletedAt: null } }
    );
    res.redirect("/forms/trash");
  } catch {
    res.status(400).send("Failed to restore form");
  }
});

/* SHOW — MUST BE LAST */
// GET /forms/:id   (hide trashed)
router.get("/forms/:id", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt)
      return res.status(404).send("Form not found");
    res.render("forms/show", { title: form.name, form });
  } catch {
    res.status(404).send("Form not found");
  }
});

module.exports = router;
