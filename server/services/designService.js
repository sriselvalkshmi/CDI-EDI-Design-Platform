const parameters = require("../data/cdiParameters.json");

function getDesignParameters(technology) {

    return parameters[technology];

}

module.exports = {

    getDesignParameters

};