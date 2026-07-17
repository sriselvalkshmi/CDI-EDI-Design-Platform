// Electrical calculations module
function electricalCalculations({ voltage, current, electrodeArea }, resolved) {
  // Power is handled separately in power module; here we compute current density
  const currentDensity = Number(((resolved.CurrentDensity ?? resolved.J ?? (current / (electrodeArea / 10000))).toFixed(2));
  return { currentDensity };
}
module.exports = electricalCalculations;
