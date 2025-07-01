const Task = require("../models/Task");
const { format } = require("date-fns");


exports.addDailyProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      boqQuantityDone,
      remarks,
      imageUrl, // ✅ Now expecting an array
      latitude,
      longitude
    } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const today = format(new Date(), "yyyy-MM-dd");

    const boqDoneToday = Number(boqQuantityDone) || 0;

    // Check if today's entry exists
    const todayLog = task.dailyProgress.find(log =>
      format(new Date(log.date), "yyyy-MM-dd") === today
    );

    if (todayLog) {
      // ✅ Append new images and update quantity/remarks
      todayLog.imageUrl.push(...imageUrl);
      todayLog.boqQuantityDone += boqDoneToday;
      todayLog.remarks = remarks || todayLog.remarks;
      todayLog.timestamp = new Date();

      // Recalculate completion %
      const totalDone = task.dailyProgress.reduce((sum, l) => sum + l.boqQuantityDone, 0);
      todayLog.percentageCompleted = Math.min((totalDone / task.boqQuantityTarget) * 100, 100).toFixed(2);

    } else {
      // New log for today
      const totalDone = task.dailyProgress.reduce((sum, log) => sum + log.boqQuantityDone, 0) + boqDoneToday;
      const percentageCompleted = Math.min((totalDone / task.boqQuantityTarget) * 100, 100).toFixed(2);

      task.dailyProgress.push({
        boqQuantityDone: boqDoneToday,
        boqUnit: task.unitOfMeasure,
        percentageCompleted: parseFloat(percentageCompleted),
        remarks,
        date: new Date(),
        timestamp: new Date(),
        imageUrl,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        submittedBy: req.user._id
      });
    }

    await task.save();

    res.status(201).json({ message: "Progress logged", progress: task.dailyProgress });
  } catch (err) {
    console.error("Daily progress error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getProgressForTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const totalAchieved = task.dailyProgress.reduce(
      (sum, entry) => sum + entry.boqQuantityDone, 0
    );
    const remaining = task.boqQuantityTarget - totalAchieved;
    const targetAchieved = totalAchieved >= task.boqQuantityTarget;

    res.json({
      progress: task.dailyProgress,
      plannedTarget: task.dailyBoqTargetPlan,
      summary: {
        boqTarget: task.boqQuantityTarget,
        totalAchieved,
        remaining: remaining > 0 ? remaining : 0,
        isTargetAchieved: targetAchieved
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
