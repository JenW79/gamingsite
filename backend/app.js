require("dotenv").config();

const express = require("express");
require("express-async-errors");
const morgan = require("morgan");
const cors = require("cors");
const csurf = require("csurf");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { ValidationError } = require("sequelize");

const routes = require("./routes");

const { environment } = require("./config");
const isProduction = environment === "production";
const allowedFrontend = process.env.FRONTEND_URL || "http://localhost:5173";

const app = express();

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// ✅ Enable CORS for Frontend Communication
app.use(
  cors({
    origin: allowedFrontend, // Your frontend URL
    credentials: true, // ✅ Allow cookies to be sent
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          allowedFrontend,
          allowedFrontend.replace(/^http/, "ws"), // supports ws:// or wss://
          "https:",
          "wss:",
        ],
      },
    },
  })
);

// ✅ Apply CSRF Protection Middleware BEFORE Routes
app.use(
  csurf({
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? "Lax" : "Strict",
      httpOnly: true, // ✅ Ensure CSRF cookie is HTTP-only
    },
  })
);

// ✅ CSRF Token Route (AFTER csurf middleware)
app.get("/api/csrf/restore", (req, res) => {
  try {
    const csrfToken = req.csrfToken();
    res.cookie("XSRF-TOKEN", csrfToken, {
      secure: isProduction,
      sameSite: isProduction ? "Lax" : "Strict",
      httpOnly: false, // ✅ Allows frontend to access it
    });
    return res.json({ csrfToken });
  } catch (error) {
    console.error("CSRF Token Error:", error);
    return res.status(500).json({ message: "Failed to generate CSRF token" });
  }
});

// ✅ Attach API Routes AFTER CSRF Middleware
app.use(routes);

const path = require("path");

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ✅ Error Handling Middleware
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = "Resource Not Found";
  err.errors = { message: "The requested resource couldn't be found." };
  err.status = 404;
  next(err);
});

// ✅ Process Sequelize Errors
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    let errors = {};
    for (let error of err.errors) {
      errors[error.path] = error.message;
    }
    err.title = "Validation error";
    err.errors = errors;
  }
  next(err);
});

// ✅ Final Error Formatter
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  res.json({
    title: err.title || "Server Error",
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack,
  });
});

module.exports = app;
