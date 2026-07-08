module.exports = function (data) {

  const tds = Number(data.tds);
  const target = Number(data.targetTds);

  if (target <= 10) {

    return {
      technology: "EDI",
      confidence: 96,
      reason: "Ultra-pure water requirement"
    };

  }

  if (tds <= 2000) {

    return {
      technology: "CDI",
      confidence: 90,
      reason: "Suitable for low salinity water"
    };

  }

  if (tds <= 5000) {

    return {
      technology: "MCDI",
      confidence: 93,
      reason: "Suitable for medium salinity water"
    };

  }

  return {

    technology: "FCDI",
    confidence: 95,
    reason: "Suitable for high salinity water"

  };

};