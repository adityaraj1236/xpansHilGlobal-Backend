const express = require("express");
const http = require("http");
const path = require("path"); // Add this
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const inviteRoutes = require("./routes/inviteRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
const workerRoutes = require("./routes/workers");
const inventoryRoutes = require("./routes/inventory");
const purchaseOrderRoutes = require("./routes/purchaseOrders");
const purchaseRequestRoutes = require("./routes/purchaseRequestRoutes");
const boqUploadRoutes = require('./routes/boqUploadRoutes');
const userRoutes = require('./routes/userRoutes');
const dailyProgressRoutes = require('./routes/dailyProgressRoutes');
const employeeRoutes =  require('./routes/EmployeeManagementRoutes/employeeRoutes')

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Serve uploads folder statically so frontend can access files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      "https://infraindia-1.onrender.com",
      "http://localhost:5173",
      // "https://xpanshil-global.vercel.app", 
      "https://xpans-hil-global.vercel.app/",
      "https://xpans-hil-global-git-main-adityaraj1236s-projects.vercel.app",
      "https://xpans-hil-global-j2n0u0lka-adityaraj1236s-projects.vercel.app",
      "https://www.xpanshilglobal.com",
      "https://xpanshilglobal.com" // ✅ ADD THIS,
        // ✅ ADD THIS TOO
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});


// Attach io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(express.json({ limit: "10kb" }));
// app.use(cors(corsOptions)); // before routes
app.use(cors({
  origin: [
    "https://infraindia-1.onrender.com",   // keep if still relevant
    "http://localhost:5173",               // for local dev
    "https://xpans-hil-global.vercel.app" ,
    "https://xpans-hil-global-git-main-adityaraj1236s-projects.vercel.app",
    "https://xpans-hil-global-j2n0u0lka-adityaraj1236s-projects.vercel.app", 
    "https://www.xpanshilglobal.com",
    "https://xpanshilglobal.com" // ✅ ADD THIS,

  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(helmet());
app.options('*', cors());
app.use(mongoSanitize());
app.use(xss());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // higher for dev
  message: "Too many requests, please try again later.",
});
app.use("/api", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
// app.use("/api/attendance", attendanceRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/purchaseOrder-request", purchaseRequestRoutes);
app.use('/api/boq', boqUploadRoutes);
app.use('/api/daily-progress' ,dailyProgressRoutes); 
app.use('/api/employees' , employeeRoutes)
// ✅ Mount it under your base API path
app.use('/api/users', userRoutes);


app.get("/api/ping", (req, res) => {
  res.status(200).json({ message: "✅ Backend connected successfully!" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// Socket.io connection listener
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server + Socket.io running on port ${PORT}`));
