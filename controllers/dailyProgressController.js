const Task = require("../models/Task");
const { format } = require("date-fns");

exports.addDailyProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      boqQuantityDone,
      remarks,
      imageUrl,
      latitude,
      longitude
    } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const today = format(new Date(), "yyyy-MM-dd");

    // Prevent multiple updates on the same day
    const alreadyLogged = task.dailyProgress.some(log =>
      format(new Date(log.date), "yyyy-MM-dd") === today
    );
    if (alreadyLogged) return res.status(400).json({ message: "Today's progress already submitted" });

    // Ensure boqQuantityDone is a number
    const boqDoneToday = Number(boqQuantityDone);

    // Calculate total done so far
    const totalDone = task.dailyProgress.reduce((sum, log) => sum + log.boqQuantityDone, 0) + boqDoneToday;

    // Calculate percentage
    const percentageCompleted = Math.min((totalDone / task.boqQuantityTarget) * 100, 100).toFixed(2);

    // Push new progress log
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

    await task.save();

    res.status(201).json({ message: "Progress updated", progress: task.dailyProgress });
  } catch (err) {
    console.error(err);
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
