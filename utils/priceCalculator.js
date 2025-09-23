const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

const calculateBasePrice = (distance, duration, vehicleType = 'sedan') => {
  const pricingConfig = {
    sedan: {
      baseFare: 50,
      perKmRate: 12,
      perMinuteRate: 2,
      surgeMultiplier: 1
    },
    hatchback: {
      baseFare: 40,
      perKmRate: 10,
      perMinuteRate: 1.5,
      surgeMultiplier: 1
    },
    suv: {
      baseFare: 70,
      perKmRate: 15,
      perMinuteRate: 2.5,
      surgeMultiplier: 1
    },
    luxury: {
      baseFare: 100,
      perKmRate: 20,
      perMinuteRate: 3,
      surgeMultiplier: 1
    }
  };

  const config = pricingConfig[vehicleType] || pricingConfig.sedan;
  
  const basePrice = config.baseFare + 
                   (distance * config.perKmRate) + 
                   (duration * config.perMinuteRate);

  return Math.round(basePrice * config.surgeMultiplier);
};

const calculateSurgePrice = (basePrice, demandFactor = 1, timeFactor = 1) => {
  let surgeMultiplier = 1;

  if (demandFactor > 1.5) {
    surgeMultiplier += 0.5;
  } else if (demandFactor > 1.2) {
    surgeMultiplier += 0.3;
  }

  if (timeFactor > 1) {
    surgeMultiplier += (timeFactor - 1) * 0.2;
  }

  const surgePrice = Math.round(basePrice * surgeMultiplier);
  
  return {
    originalPrice: basePrice,
    surgePrice: surgePrice,
    surgeMultiplier: Math.round(surgeMultiplier * 10) / 10
  };
};

const estimateDuration = (distance, averageSpeed = 25) => {
  return Math.round((distance / averageSpeed) * 60);
};

const calculatePriceRange = (basePrice, maxVariation = 0.3) => {
  const minPrice = Math.round(basePrice * (1 - maxVariation));
  const maxPrice = Math.round(basePrice * (1 + maxVariation));
  
  return {
    minPrice,
    maxPrice,
    basePrice
  };
};

const validateBidAmount = (bidAmount, basePrice, customerMaxPrice) => {
  const errors = [];

  if (bidAmount < basePrice * 0.5) {
    errors.push('Bid amount is too low');
  }

  if (bidAmount > customerMaxPrice) {
    errors.push('Bid amount exceeds customer maximum price');
  }

  if (bidAmount < 0) {
    errors.push('Bid amount cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  calculateDistance,
  calculateBasePrice,
  calculateSurgePrice,
  estimateDuration,
  calculatePriceRange,
  validateBidAmount
};