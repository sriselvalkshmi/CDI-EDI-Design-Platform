const recommendEngine = require("../services/recommendationEngine");
const simulationService=require("../services/simulationService");
exports.recommendTechnology = (req, res) => {
    const result=simulationService(req.body);
    res.json(result);
};

exports.simulate = (req, res) => {
  const result = simulationEngine(req.body);
  res.json(result);
};