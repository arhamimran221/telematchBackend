const db = require("../config/db");
const admin = require("../firebase");

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM notifications");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNotification = async (req, res) => {
  const { header, body } = req.body; // Removed userId from request body

  // Validate input
  if (!header || !body) {
    return res.status(400).json({ error: "Header and body are required." });
  }

  try {
    // Insert the notification into the database
    const [result] = await db.execute(
      "INSERT INTO notifications (header, body) VALUES (?, ?)",
      [header, body]
    );

    // Fetch all users with a registration token
    const [users] = await db.execute(
      "SELECT id, registration_token FROM users WHERE registration_token IS NOT NULL"
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ error: "No users found with registration tokens." });
    }

    // Prepare the push notification payload
    const message = {
      notification: {
        title: header,
        body: body,
      },
      android: {
        notification: {
          sound: "default",
        },
      },
    };

    // Send push notification to each user's registration token
    const promises = users.map((user) => {
      return admin.messaging().send({
        ...message,
        token: user.registration_token,
      });
    });

    await Promise.all(promises);
    console.log("Successfully sent messages to all users");

    res.status(201).json({
      message: "Notification created and sent successfully to all users",
      notificationId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
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
