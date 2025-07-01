// const BOQ = require("../models/BOQ");
const BOQ = require("../models/BOQ/BOQ");
const BOQItem = require("../models/BOQ/BOQItem");
const BOQSection = require("../models/BOQ/BOQSection");
const BOQSubTask = require("../models/BOQ/BOQSubTask");
const { streamUpload } = require("../utils/cloudinary");
const axios = require("axios");
const Formidable = require("formidable"); // To parse form-data (npm install formidable)
const Project = require("../models/Project");

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

    // 🔗 Update the project to link this BOQ
    await Project.findByIdAndUpdate(projectId, { boq: boq._id });

    res.status(201).json({ message: "BOQ created and linked to project", boq });

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




//with the help of nano nets 
const sendToNanonets = async (url) => {
  const response = await axios.post(
    `https://app.nanonets.com/api/v2/OCR/Model/016deecd-2f00-44d5-b0f8-01e656b5360f/LabelUrls/?async=false`,
    new URLSearchParams({ urls: url }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from("40bc3ff1-5390-11f0-80d2-36802fcbbb71" + ":").toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
};

// 📦 Route Handler
exports.uploadBOQAndParse = async (req, res) => {
  try {
    console.log("📥 File received in backend:", req.file?.originalname);

    const cloudRes = await streamUpload(req.file.buffer, "boq_files");
    console.log("☁️ Cloudinary upload done:", cloudRes.secure_url);

    const url = cloudRes.secure_url;
    console.log("📨 Sending to Nanonets with URL:", url);

    const nanoRes = await axios.post(
      "https://app.nanonets.com/api/v2/OCR/Model/016deecd-2f00-44d5-b0f8-01e656b5360f/LabelUrls/?async=false",
      new URLSearchParams({ urls: url }),
      {
        headers: {
          Authorization: "Basic " + Buffer.from("40bc3ff1-5390-11f0-80d2-36802fcbbb71" + ":").toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("🧠 Nanonet Response:", nanoRes.data);
    return res.json({ json: nanoRes.data });
  } catch (err) {
    console.error("❌ BOQ Upload error:", err?.response?.data || err.message);
    return res.status(500).json({
      error: "Upload failed",
      details: err?.response?.data || err.message,
    });
  }
};




