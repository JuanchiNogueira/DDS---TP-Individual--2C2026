import { seedDatabase as defaultSeedDatabase } from '../repositories/DataSeeder.js';

export class SeedController {
  constructor({ seedFn = defaultSeedDatabase } = {}) {
    this.seedFn = seedFn;
  }

  seed = async (req, res, next) => {
    try {
      const data = this.seedFn();
      return res.status(201).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  };
}

export const seedController = new SeedController();
export default seedController;
