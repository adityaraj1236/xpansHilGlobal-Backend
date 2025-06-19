const Task = require("../models/Task");
const DailyProgressSchema = require("../models/DailyProgress");
const { format } = require("date-fns");

exports.addDailyProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { boqQuantityDone, remarks } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const today = format(new Date(), "yyyy-MM-dd");

    // Prevent multiple updates on the same day
    const alreadyLogged = task.dailyProgress.some(log =>
      format(new Date(log.date), "yyyy-MM-dd") === today
    );
    if (alreadyLogged) return res.status(400).json({ message: "Today's progress already submitted" });

    // Compute % completed
    const totalDone = task.totalBoqDone + boqQuantityDone;
    const percentageCompleted = Math.min((totalDone / task.boqQuantityTarget) * 100, 100).toFixed(2);

    task.dailyProgress.push({
      boqQuantityDone,
      boqUnit: task.unitOfMeasure,
      precentageCompleted: percentageCompleted,
      remarks,
      date: new Date()
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

    res.json({
      progress: task.dailyProgress,
      plannedTarget: task.dailyBoqTargetPlan
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
