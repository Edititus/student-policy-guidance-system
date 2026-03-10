import { Router, Request, Response } from 'express';
import { School } from '../models';

const router = Router();

// GET /api/schools - List all active schools (public endpoint for login dropdown)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const schools = await School.findAll({
      where: { active: true },
      attributes: ['id', 'name', 'domain', 'country', 'type'],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        domain: s.domain,
        country: s.country,
        type: s.type,
      })),
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools',
    });
  }
});

export default router;
