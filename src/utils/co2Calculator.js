const axios = require('axios');
const logger = require('./logger');

// Emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  travel: {
    car_gasoline: 0.21, // per km
    car_diesel: 0.17,   // per km
    flight_domestic: 0.25, // per km
    flight_international: 0.15, // per km
    train: 0.04,        // per km
    bus: 0.08          // per km
  },
  energy: {
    electricity: 0.5,   // per kWh
    natural_gas: 2.0,   // per cubic meter
    heating_oil: 2.7    // per liter
  },
  food: {
    beef: 27,           // per kg
    pork: 12,           // per kg
    chicken: 6,         // per kg
    fish: 5,            // per kg
    vegetables: 2       // per kg
  }
};

class CO2Calculator {
  static calculateEmission(emissionType, category, amount, unit = null) {
    try {
      const factor = EMISSION_FACTORS[emissionType]?.[category];
      if (!factor) {
        throw new Error(`Unknown emission category: ${emissionType}.${category}`);
      }

      const co2eKg = amount * factor;
      logger.debug(`Calculated ${co2eKg} kg CO2e for ${amount} ${unit || 'units'} of ${category}`);
      
      return {
        co2e_kg: Math.round(co2eKg * 100) / 100, // Round to 2 decimal places
        factor_used: factor,
        calculation: `${amount} × ${factor} = ${co2eKg} kg CO2e`
      };
    } catch (error) {
      logger.error('CO2 calculation error:', error);
      throw error;
    }
  }

  static async calculateWithExternalAPI(emissionType, category, amount, unit) {
    try {
      // Placeholder for external API integration (e.g., CarbonInterface)
      if (process.env.CARBON_INTERFACE_API_KEY) {
        const response = await axios.post('https://www.carboninterface.com/api/v1/estimates', {
          type: emissionType,
          [category]: {
            value: amount,
            unit: unit
          }
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.CARBON_INTERFACE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        return {
          co2e_kg: response.data.data.attributes.carbon_kg,
          source: 'CarbonInterface API'
        };
      }

      // Fallback to internal calculation
      return this.calculateEmission(emissionType, category, amount, unit);
    } catch (error) {
      logger.warn('External API failed, using internal calculation:', error.message);
      return this.calculateEmission(emissionType, category, amount, unit);
    }
  }

  static getSupportedCategories() {
    return EMISSION_FACTORS;
  }
}

module.exports = CO2Calculator;