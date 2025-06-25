// const BOQItem = require("../models/BOQItem");

const BOQItem = require("../models/BOQ/BOQItem");

exports.createItem = async (req, res) => {
  try {
    const {
      boqId,
      sectionId,
      itemCode,
      description,
      boq,
      drawing,
      work
    } = req.body;

    if (!boqId || !sectionId || !description) {
      return res.status(400).json({ message: "boqId, sectionId and description are required" });
    }

    const newItem = new BOQItem({
      boqId,
      sectionId,
      itemCode,
      description,
      boq,
      drawing,
      work
    });

    await newItem.save();
    res.status(201).json({ message: "BOQ item added", item: newItem });

  } catch (err) {
    console.error("Error adding BOQ item:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
