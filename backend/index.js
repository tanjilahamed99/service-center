const { createServer } = require("http");
require("dotenv").config();

const cors = require("cors");
const express = require("express");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_2,
    ],
    credentials: true,
  }),
);
app.use(express.json());
const httpServer = createServer(app);
const port = parseInt(process.env.PORT) || 5000;
const connectDB = require("./src/db/connectDB.js");

const userRoutes = require("./src/routes/auth/index.js");
const adminRoutes = require("./src/routes/admin/index.js");
const companyRoutes = require("./src/routes/company/index.js");
const serviceCenterRoutes = require("./src/routes/service-center/index.js");
const serviceEngineerRoutes = require("./src/routes/service-engineer/index.js");

app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/service-center", serviceCenterRoutes);
app.use("/api/service-engineer", serviceEngineerRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the virtual callbell Call Backend");
});

// Start HTTP server with retry on EADDRINUSE (try next ports)
const startServerWithRetry = (startPort, maxRetries = 5) => {
  let attempts = 0;

  const tryListen = (portToTry) => {
    // Use once() so listeners don't accumulate between retries
    httpServer.once("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        if (attempts < maxRetries) {
          console.warn(`Port ${portToTry} in use, trying ${portToTry + 1}...`);
          attempts += 1;
          // small delay before retrying to allow OS to settle
          setTimeout(() => tryListen(portToTry + 1), 200);
        } else {
          console.error(
            `Port ${startPort} and next ${maxRetries} ports are in use. Exiting.`,
          );
          process.exit(1);
        }
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });

    httpServer.once("listening", () => {
      const addr = httpServer.address();
      const listeningPort = typeof addr === "object" ? addr.port : addr;
      console.log("listening to port", listeningPort);
    });

    httpServer.listen(portToTry);
  };

  tryListen(startPort);
};

const main = async () => {
  console.log("Called");
  await connectDB();

  // Start server with retries if port is already in use
  startServerWithRetry(port, 10);
};

main();
