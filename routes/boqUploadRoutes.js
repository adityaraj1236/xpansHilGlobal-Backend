const express = require("express");
const { createBOQ, getBOQByProject, uploadBOQAndParse} = require("../controllers/boqController");
const { createSection } = require("../controllers/boqSectionController");
const { createItem } = require("../controllers/boqItemsController");
const { createSubtask } = require("../controllers/boqSubtaskController");
const router = express.Router();
// const boqController = require("../controllers/boqController");
// ✅ Add this at the top of boqUploadRoutes.js
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Create BOQ for a project
router.post("/create", createBOQ);

//uplaod and parse using nanonet 
router.post("/upload",upload.single("file") , uploadBOQAndParse);

// Create a section under a BOQ


router.post("/section/create", createSection);

// Add BOQ item (task)
router.post("/item/create", createItem);


// Add subtask to item
router.post("/subtask/create", createSubtask);

// Add BOQ item (task)
// router.post("/item/create", boqItemController.createItem);


// ✅ NEW: Get full BOQ for a project
router.get("/project/:projectId", getBOQByProject);
module.exports = router;
