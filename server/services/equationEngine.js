class EquationEngine {

    static hydraulicRetentionTime(volume, flowRate) {

        return volume / flowRate;

    }

    static emptyBedContactTime(volume, flowRate) {

        return volume / flowRate;

    }

    static saltAdsorptionCapacity(charge, electrodeMass) {

        return charge / electrodeMass;

    }

    static chargeEfficiency(adsorbedSalt, theoreticalSalt) {

        return (adsorbedSalt / theoreticalSalt) * 100;

    }

    static electrodeArea(length, width) {

        return length * width;

    }

    static reactorVolume(diameter, height) {

        const r = diameter / 2;

        return Math.PI * r * r * height;

    }

    static superficialVelocity(flowRate, area) {

        return flowRate / area;

    }

}

module.exports = EquationEngine;