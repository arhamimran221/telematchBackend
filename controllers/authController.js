const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// User registration
exports.register = async (req, res) => {
  const { name, email, password, registration_token } = req.body; // Include token in the destructure

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [rows] = await db.execute(
      "INSERT INTO users (username, password, first_name , registration_token) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, name, registration_token]
    );

    res
      .status(201)
      .json({ message: "User registered successfully", userId: rows.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// User login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  const userId = req.params.id;

  try {
    // Query to get user details by ID
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0]; // Assuming ID is unique and returns a single row
    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
