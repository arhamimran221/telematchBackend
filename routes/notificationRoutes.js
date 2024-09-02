const express = require("express");
const {
  getNotifications,
  createNotification,
  updateNotification,
  acceptNotification,
  snoozeNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getNotifications);
router.post("/", createNotification);
router.put("/:id", updateNotification);
router.post("/:id/accept", acceptNotification);
router.post("/:id/snooze", snoozeNotification);

module.exports = router;
