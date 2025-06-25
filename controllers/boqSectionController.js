const BOQSection = require("../models/BOQ/BOQSection");


exports.createSection = async (req, res) => {
  try {
    const { boqId, title } = req.body;

    if (!boqId || !title) {
      return res.status(400).json({ message: "boqId and section title are required" });
    }

    const section = new BOQSection({
      boqId,
      title
    });

    await section.save();
    res.status(201).json({ message: "Section created", section });

  } catch (err) {
    console.error("Error creating section:", err);
    res.status(500).json({ message: "Server Error" });
  }
};