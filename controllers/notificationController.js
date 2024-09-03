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

    // Prepare the push notification payload template
    const messageTemplate = {
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

    // Send push notifications to each user's registration token
    const promises = users.map((user) => {
      if (user.registration_token) {
        // Check if the token exists
        const message = {
          ...messageTemplate,
          token: user.registration_token, // Assign the token to each message
        };
        return admin.messaging().send(message);
      } else {
        console.warn(
          `User with ID ${user.id} has no valid registration token.`
        );
        return Promise.resolve(); // Return a resolved promise if no valid token
      }
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
    // Update the notification to mark it as snoozed
    await db.execute("UPDATE notifications SET snoozed = 1 WHERE id = ?", [id]);

    // Fetch the notification details and user registration token
    const [notificationResult] = await db.execute(
      "SELECT header, body, user_id FROM notifications WHERE id = ?",
      [id]
    );

    if (notificationResult.length === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }

    const notification = notificationResult[0];

    // Fetch the user's registration token
    const [users] = await db.execute(
      "SELECT registration_token FROM users WHERE id = ? AND registration_token IS NOT NULL",
      [notification.user_id]
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ error: "User not found or user has no registration token." });
    }

    const registrationToken = users[0].registration_token;

    // Schedule a function to send a push notification after 30 minutes
    setTimeout(async () => {
      const message = {
        notification: {
          title: notification.header,
          body: notification.body,
        },
        android: {
          notification: {
            sound: "default",
          },
        },
        token: registrationToken,
      };

      try {
        await admin.messaging().send(message);
        console.log("Snoozed notification sent successfully after 30 minutes.");
      } catch (error) {
        console.error("Error sending snoozed notification:", error);
      }
    }, 30); // 30 minutes in milliseconds

    res.json({ message: "Notification snoozed successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
