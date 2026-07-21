// Electrical calculations module
function electricalCalculations(
  { voltage = 0, current = 0, electrodeArea = 0 },
  resolved = {}
) {
  const areaM2 = electrodeArea > 0 ? electrodeArea / 10000 : 0;

  const currentDensity =
    resolved.CurrentDensity ??
    resolved.J ??
    (areaM2 > 0 ? current / areaM2 : null);

  return {
    currentDensity:
      currentDensity != null ? Number(currentDensity.toFixed(2)) : null,
  };
}

export default electricalCalculations;
