const express = require("express");
const router = express.Router();
const{ requireAuth } = require("../../utils/auth");

router.get("/", requireAuth, (req, res) => {
  const thresholds = Array.from({ length: 100 }, (_, i) =>
    i === 0 ? 0 : Math.floor(50 * Math.pow(i, 1.5))
  );
  res.json({ thresholds });
});

module.exports = router;
