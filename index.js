const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const groupRoutes = require("./routes/groupRoutes");
const cors = require("cors");
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", groupRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
