const db = require("../config/db");

// Get notification groups
exports.getGroups = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM notification_groups");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new notification group
exports.createGroup = async (req, res) => {
  const { locationId, name, tag, overflowTime, overflowNotificationGroup } =
    req.body;

  try {
    const [result] = await db.execute(
      "INSERT INTO notification_groups (location_id, name, tag, overflow_time, overflow_notification_group) VALUES (?, ?, ?, ?, ?)",
      [locationId, name, tag, overflowTime, overflowNotificationGroup]
    );
    res
      .status(201)
      .json({
        message: "Group created successfully",
        groupId: result.insertId,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
