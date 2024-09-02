const db = require("../config/db");
const admin = require("firebase-admin");

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM notifications");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

exports.createNotification = async (req, res) => {
  const { header, body } = req.body;

  // Validate input
  if (!header || !body) {
    return res.status(400).json({ error: "Header and body are required." });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO notifications (header, body) VALUES (?, ?)",
      [header, body]
    );

    // Fetch all user device tokens from your database
    const [users] = await db.execute(
      "SELECT device_token FROM users WHERE device_token IS NOT NULL"
    );
    const tokens = users.map((user) => user.device_token);

    // Send push notification to all users
    const payload = {
      notification: {
        title: header,
        body: body,
      },
    };

    if (tokens.length > 0) {
      admin
        .messaging()
        .send(tokens, payload)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    }

    res.status(201).json({
      message: "Notification created successfully",
      notificationId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a notification
exports.updateNotification = async (req, res) => {
  const { id } = req.params;
  const {
    typeId,
    priority,
    notificationGroupId,
    datetime,
    header,
    body,
    source,
  } = req.body;

  try {
    await db.execute(
      "UPDATE notifications SET type_id = ?, priority = ?, notification_group_id = ?, datetime = ?, header = ?, body = ?, source = ? WHERE id = ?",
      [
        typeId,
        priority,
        notificationGroupId,
        datetime,
        header,
        body,
        source,
        id,
      ]
    );
    res.json({ message: "Notification updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.acceptNotification = async (req, res) => {
  const { id } = req.params;
  const { acceptedBy } = req.body;

  try {
    await db.execute(
      "UPDATE notifications SET accepted = 1, accepted_by = ? WHERE id = ?",
      [acceptedBy, id]
    );
    res.json({ message: "Notification accepted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Snooze a notification
exports.snoozeNotification = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("UPDATE notifications SET snoozed = 1 WHERE id = ?", [id]);
    res.json({ message: "Notification snoozed successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
