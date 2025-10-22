const CO2Calculator = require('../src/utils/co2Calculator');

describe('CO2Calculator', () => {
  describe('calculateEmission', () => {
    it('should calculate car gasoline emissions correctly', () => {
      const result = CO2Calculator.calculateEmission('travel', 'car_gasoline', 100, 'km');
      
      expect(result.co2e_kg).toBe(21); // 100 * 0.21
      expect(result.factor_used).toBe(0.21);
      expect(result.calculation).toContain('100 × 0.21 = 21');
    });

    it('should calculate electricity emissions correctly', () => {
      const result = CO2Calculator.calculateEmission('energy', 'electricity', 50, 'kWh');
      
      expect(result.co2e_kg).toBe(25); // 50 * 0.5
      expect(result.factor_used).toBe(0.5);
    });

    it('should round to 2 decimal places', () => {
      const result = CO2Calculator.calculateEmission('travel', 'car_gasoline', 33.333, 'km');
      
      expect(result.co2e_kg).toBe(7); // 33.333 * 0.21 = 6.99993, rounded to 7
    });

    it('should throw error for unknown category', () => {
      expect(() => {
        CO2Calculator.calculateEmission('travel', 'unknown_category', 100, 'km');
      }).toThrow('Unknown emission category: travel.unknown_category');
    });

    it('should throw error for unknown emission type', () => {
      expect(() => {
        CO2Calculator.calculateEmission('unknown_type', 'car_gasoline', 100, 'km');
      }).toThrow('Unknown emission category: unknown_type.car_gasoline');
    });
  });

  describe('getSupportedCategories', () => {
    it('should return all supported categories', () => {
      const categories = CO2Calculator.getSupportedCategories();
      
      expect(categories).toHaveProperty('travel');
      expect(categories).toHaveProperty('energy');
      expect(categories).toHaveProperty('food');
      expect(categories.travel).toHaveProperty('car_gasoline');
      expect(categories.energy).toHaveProperty('electricity');
      expect(categories.food).toHaveProperty('beef');
    });
  });
});

module.exports = {};