const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register a new user
exports.register = async (req, res) => {
  try {
    let { name, email, password, role , organization } = req.body;

    // Convert role to lowercase and remove spaces
    role = role?.toLowerCase().replace(/\s+/g, "");


    //restricting elf registraion to only admin and vendor 
const publicRoles = ["vendor" , "admin" , "hr"];
if (!publicRoles.includes(role)) {
  return res.status(403).json({ 
    error: `You cannot register as a '${role}' via UI. Please contact your organization admin.` 
  });
}

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // 🔹 Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with hashed password
    const user = await User.create({ name, email, password: hashedPassword, role  , organization});

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ 
      message: "User registered successfully ✅", 
      token, 
      user 
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Registration failed. Try again later." });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    let { email, password, role } = req.body;

    // 🔍 DEBUG: Log raw input
    console.log("🔐 Login Debug:");
    console.log("Email submitted:", email);
    console.log("Password submitted:", password);
    console.log("Role submitted:", role);

    // 🧠 Step 1: Check if user exists
    const user = await User.findOne({ email }).populate("organization");

    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(401).json({ error: "Invalid credentials ❌" });
    }

    // 🧠 Step 2: Normalize and validate role
    role = role?.toLowerCase().replace(/\s+/g, "");
    console.log("✅ DB Role:", user.role);
    console.log("✅ Submitted Role:", role);

    if (user.role !== role) {
      console.log(`❌ Role mismatch: Expected ${user.role}, Received ${role}`);
      return res.status(403).json({ error: `Access denied ❌. You are not a ${role}.` });
    }

    // 🧠 Step 3: Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("✅ Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch for user:", email);
      return res.status(401).json({ error: "Invalid credentials ❌" });
    }

    // ✅ Step 4: Generate JWT Token
    if (!process.env.JWT_SECRET) {
      throw new Error("Missing JWT_SECRET in environment variables");
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        role: user.role,
        organization: user.organization?._id?.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: `User logged in as ${role} successfully ✅`,
      token,
      user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed. Try again later." });
  }
};


// Logout user (Invalidate token)
exports.logout = async (req, res) => {
  try {
    res.json({ message: "User logged out successfully ✅" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Logout failed. Try again later." });
  }
};


exports.setpassword = async (req, res) => {
  const { token, password, name } = req.body;

  // 1. Find the invite
  const invite = await Invite.findOne({ token });

  if (!invite || invite.expiresAt < Date.now() || invite.status !== 'Accepted') {
    return res.status(400).json({ message: 'Invalid or expired invitation.' });
  }

  // 2. Check if user already exists (optional safety)
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already registered. Try logging in.' });
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create user
  const user = new User({
    name: name || invite.email.split('@')[0], // default name
    email: invite.email,
    password: hashedPassword,
    role: 'projectmanager',
    organization: invite.orgId,
  });

  await user.save();

  // 5. Update invite status (optional)
  invite.status = 'Completed';
  await invite.save();

  res.json({ message: 'Account created. You can now log in.' });
}
