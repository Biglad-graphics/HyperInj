import { Router, Request, Response } from 'express';
import { getUserPositions, getFreeCollateral } from '../services/movement';

const router = Router();

router.get('/:address', async (req: Request, res: Response) => {
  const { address } = req.params;
  const [positions, freeCollateral] = await Promise.all([
    getUserPositions(address),
    getFreeCollateral(address),
  ]);
  res.json({ address, positions, freeCollateral });
});

export default router;
