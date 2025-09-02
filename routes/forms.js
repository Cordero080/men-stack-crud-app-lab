// routes/forms.js
// Purpose: CRUD routes for Form + soft delete + trash + restore.
// Also provides chart data, rank requirements, and kyu belt-chip classes to /forms/new.

const express = require("express");
const router = express.Router();
const Form = require("../models/Form");

/* ----------------------------- Helpers ----------------------------- */

// Dropdown list of alive form names (sorted)
async function getNameList() {
  const docs = await Form.find({ deletedAt: null })
    .sort({ name: 1 })
    .select("name -_id");
  return docs.map((d) => d.name);
}

// Mongoose validation error -> flat { field: message }
function formatErrors(err) {
  return Object.fromEntries(
    Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
  );
}

// Chart data: count *alive* forms per rank (KYU 10→1, DAN 1→8)
async function getChartData() {
  const labelOrder = [
    ...Array.from({ length: 10 }, (_, i) => `KYU ${10 - i}`),
    ...Array.from({ length: 8 },  (_, i) => `DAN ${i + 1}`),
  ];
  const countsMap = new Map(labelOrder.map((l) => [l, 0]));

  const alive = await Form.find({ deletedAt: null }).select("rankType rankNumber");
  for (const f of alive) {
    const label = `${String(f.rankType).toUpperCase()} ${Number(f.rankNumber)}`;
    if (countsMap.has(label)) countsMap.set(label, countsMap.get(label) + 1);
  }
  return {
    chartLabels: labelOrder,
    chartCounts: labelOrder.map((l) => countsMap.get(l)),
  };
}

// Rank requirements — forms only (no weapons/prep)
function getRequirements() {
  const kyuRequirements = {
    10: ['Basic (Kihon, Tando Ku, Fukyu) Kata #1', 'Basic Kata #1 Bunkai (both sides)', 'Sanchin Kata'],
     9: ['Basic (Kihon, Tando Ku, Fukyu) Kata #2', 'Basic Kata #2 Bunkai (both sides)', 'Kiso Kumite #1'],
     8: ['Geikisai #1 Kata', 'Geikisai #1 Bunkai (both sides)'],
     7: ['Geikisai #2 Kata', 'Geikisai #2 Bunkai (both sides)', 'Kiso Kumite #2'],
     6: ['Geikisai #3 Kata', 'Geikisai #3 Bunkai (both sides)', 'Tensho Kata', 'Kiso Kumite #3'],
     5: ['Saifa Kata', 'Geikiha Kata'],
     4: ['Saifa Bunkai', 'Gaikiha Bunkai', 'Kiso Kumite #4'],
     3: ['Seyunchin Kata', 'Kakuha Kata', 'Kiso Kumite #5'],
     2: ['Kakuha Bunkai', 'Seisan Kata'],
     1: ['Seisan Bunkai', 'Kiso Kumite #6', 'Sai Kata #1'],
  };
  const danRequirements = {
    1: ['Seipai Kata', 'Kiso Kumite #7', 'Jisien Kumite', 'Seipai Kai Sai Kumite'],
    2: ['Shisochin Kata', 'Shisochin Kai Sai Kumite'],
    3: ['Sanseiru Kata', 'Sanseiru Kai Sai Kumite'],
    4: ['Kururunfa Kata', 'Kururunfa Kai Sai Kumite'],
    5: ['Pichurin Kata', 'Peichurin Kai Sai Kumite'],
    6: ['Hakatsuru Kata Sho'],
    7: ['Hakatsuru Kata Dai'],
    8: ['Kin Gai Ryu Kakaho Kata', 'Kin Gai Ryu #1 Kata', 'Kin Gai Ryu #2 Kata'],
  };
  return { kyuRequirements, danRequirements };
}

// Belt “chip” CSS class per KYU rank (must match your public/css/chart.css)
function getKyuChipMap() {
  return {
    10: 'chip-white',
     9: 'chip-white-orange',
     8: 'chip-orange',
     7: 'chip-orange-green',
     6: 'chip-green',
     5: 'chip-green-purple',
     4: 'chip-purple',
     3: 'chip-purple-brown',
     2: 'chip-brown',
     1: 'chip-black',
  };
}

// Collect everything new.ejs needs
async function getNewPageData() {
  const [names, chart, reqs] = await Promise.all([
    getNameList(),
    getChartData(),
    Promise.resolve(getRequirements()),
  ]);

  return {
    names,
    chartLabels: chart.chartLabels,
    chartCounts: chart.chartCounts,
    kyuRequirements: reqs.kyuRequirements,
    danRequirements: reqs.danRequirements,
    kyuChipMap: getKyuChipMap(),
  };
}

/* ------------------------------ CREATE ------------------------------ */

// GET /forms/new — create page (+ dropdown, chart, requirements, belt chips)
router.get("/forms/new", async (req, res) => {
  try {
    const data = await getNewPageData();
    res.render("new", {
      title: "Add New Martial Arts Form",
      error: null,
      errors: {},
      formData: {},
      ...data,
    });
  } catch (e) {
    console.error("GET /forms/new error:", e.message);
    res.render("new", {
      title: "Add New Martial Arts Form",
      error: "Failed to load reference data.",
      errors: {},
      formData: {},
      names: [],
      chartLabels: [],
      chartCounts: [],
      kyuRequirements: {},
      danRequirements: {},
      kyuChipMap: {},
    });
  }
});

// POST /forms — create
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

    // Duplicate check among alive docs
    const exists = await Form.exists({
      name,
      rankType,
      rankNumber: Number(rankNumber),
      deletedAt: null,
    });
    if (exists) {
      const data = await getNewPageData();
      return res.status(400).render("new", {
        title: "Add New Martial Arts Form",
        error: "That form already exists for this rank.",
        errors: {},
        formData: req.body,
        ...data,
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
      // no deletedAt => alive
    });

    res.redirect("/forms");
  } catch (err) {
    // Unique index race condition
    if (err && err.code === 11000) {
      const data = await getNewPageData();
      return res.status(400).render("new", {
        title: "Add New Martial Arts Form",
        error: "That form already exists for this rank.",
        errors: {},
        formData: req.body,
        ...data,
      });
    }
    if (err.name === "ValidationError") {
      const data = await getNewPageData();
      return res.status(400).render("new", {
        title: "Add New Martial Arts Form",
        error: null,
        errors: formatErrors(err),
        formData: req.body,
        ...data,
      });
    }
    next(err);
  }
});

/* ------------------------------- READ ------------------------------- */

// GET /forms — alive only
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

// GET /forms/trash — soft-deleted only
router.get("/forms/trash", async (_req, res) => {
  try {
    const forms = await Form.find({ deletedAt: { $ne: null } }).sort({
      updatedAt: -1,
    });
    res.render("forms/trash", { title: "Trash", forms });
  } catch {
    res.status(500).send("Failed to load trash");
  }
});

/* ------------------------------ UPDATE ------------------------------ */

// GET /forms/:id/edit — block editing trashed docs
router.get("/forms/:id/edit", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt) return res.status(404).send("Form not found");
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

// PUT /forms/:id — update with duplicate guard
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

    // Prevent duplicate with another alive record
    const exists = await Form.exists({
      _id: { $ne: req.params.id },
      name,
      rankType,
      rankNumber: Number(rankNumber),
      deletedAt: null,
    });
    if (exists) {
      const form = await Form.findById(req.params.id);
      return res.status(400).render("forms/edit", {
        title: `Edit: ${form?.name || "Form"}`,
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

/* ----------------- DELETE (soft) + restore + hard ------------------ */

// DELETE /forms/:id — soft by default; hard if ?hard=1 or body.hard=1
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

// POST /forms/:id/restore — undo soft delete
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

/* -------------------------------- SHOW ------------------------------ */

// Keep last so it doesn’t shadow other routes
router.get("/forms/:id", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || form.deletedAt) return res.status(404).send("Form not found");
    res.render("forms/show", { title: form.name, form });
  } catch {
    res.status(404).send("Form not found");
  }
});

module.exports = router;
