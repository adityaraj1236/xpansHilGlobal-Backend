const BOQSubTask = require("../models/BOQ/BOQSubTask");

exports.createSubtask = async (req, res) => {
  try {
    const { itemId, title, boq, drawing, work } = req.body;

    if (!itemId || !title) {
      return res.status(400).json({ message: "itemId and title are required" });
    }

    const newSubtask = new BOQSubTask({
      itemId,
      title,
      boq,
      drawing,
      work
    });

    await newSubtask.save();
    res.status(201).json({ message: "Subtask added", subtask: newSubtask });

  } catch (err) {
    console.error("Error adding subtask:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
