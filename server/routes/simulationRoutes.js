const express = require("express");

const router = express.Router();

const {
  recommendTechnology,
  simulate
} = require("../controllers/simulationController");

router.post("/recommend", recommendTechnology);

router.post("/simulate", simulate);

module.exports = router;