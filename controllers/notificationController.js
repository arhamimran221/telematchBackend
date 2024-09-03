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
  const { header, body, userId } = req.body; // Include userId in request body

  // Validate input
  if (!header || !body || !userId) {
    return res
      .status(400)
      .json({ error: "Header, body, and userId are required." });
  }

  try {
    // Insert the notification into the database
    const [result] = await db.execute(
      "INSERT INTO notifications (header, body) VALUES (?, ?)",
      [header, body]
    );

    // Fetch the registration token for the specified user
    const [users] = await db.execute(
      "SELECT registration_token FROM users WHERE id = ? AND registration_token IS NOT NULL",
      [userId]
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ error: "User not found or user has no registration token." });
    }

    const registrationToken = users[0].registration_token;

    // Prepare the push notification payload
    const payload = {
      notification: {
        title: header,
        body: body,
      },
    };

    // Send push notification to the user's registration token
    admin
      .messaging()
      .sendToDevice(registrationToken, payload) // Correct method to use with a single registration token
      .then((response) => {
        console.log("Successfully sent message:", response);
        res.status(201).json({
          message: "Notification created and sent successfully",
          notificationId: result.insertId,
        });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send notification" });
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
