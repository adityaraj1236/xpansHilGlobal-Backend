// const BOQ = require("../models/BOQ");
const BOQ = require("../models/BOQ/BOQ");
const BOQItem = require("../models/BOQ/BOQItem");
const BOQSection = require("../models/BOQ/BOQSection");
const BOQSubTask = require("../models/BOQ/BOQSubTask");

exports.createBOQ = async (req, res) => {
  try {
    const { projectId, organisationId, name } = req.body;

    if (!projectId || !organisationId) {
      return res.status(400).json({ message: "Project and Organisation are required." });
    }

    const boq = new BOQ({
      projectId,
      organisationId,
      name: name || "Main BOQ"
    });

    await boq.save();
    res.status(201).json({ message: "BOQ created", boq });

  } catch (err) {
    console.error("Error creating BOQ:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getBOQByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const boq = await BOQ.findOne({ projectId });

    if (!boq) {
      return res.status(404).json({ message: "No BOQ found for this project" });
    }

    const sections = await BOQSection.find({ boqId: boq._id });

    const result = [];

    for (const section of sections) {
      const items = await BOQItem.find({ sectionId: section._id });

      const itemsWithSubtasks = await Promise.all(
        items.map(async (item) => {
          const subtasks = await BOQSubTask.find({ itemId: item._id });

          return {
            _id: item._id,
            description: item.description,
            boq: item.boq,
            drawing: item.drawing,
            work: item.work,
            subtasks: subtasks.map((s) => ({
              _id: s._id,
              title: s.title,
              boq: s.boq,
              drawing: s.drawing,
              work: s.work,
            })),
          };
        })
      );

      result.push({
        _id: section._id,
        title: section.title,
        items: itemsWithSubtasks
      });
    }

    res.json({
      boqId: boq._id,
      sections: result
    });

  } catch (err) {
    console.error("Error fetching BOQ:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
