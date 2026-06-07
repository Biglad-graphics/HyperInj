import { Router } from 'express';
import { createAgent, getAllAgents, getAgentById, updateAgent, deleteAgent } from '../controllers/agent';
import { createIndicator, getAllIndicators, getIndicatorById, updateIndicator, deleteIndicator } from '../controllers/indicator';
import { getAvailableBalance, placeOrder } from '../controllers/exchange/injective';
import {
  createStrategy, getUserStrategies, getUserStrategy,
  updateStrategy, deleteStrategy,
} from '../controllers/strategy';
import { registerUser, getUserByWalletId } from '../controllers/user';

const router = Router();

// Agents
router.get('/agents', getAllAgents);
router.post('/agents', createAgent);
router.get('/agents/:id', getAgentById);
router.put('/agents/:id', updateAgent);
router.delete('/agents/:id', deleteAgent);

// Indicators
router.get('/indicators', getAllIndicators);
router.post('/indicators', createIndicator);
router.get('/indicators/:id', getIndicatorById);
router.put('/indicators/:id', updateIndicator);
router.delete('/indicators/:id', deleteIndicator);

// Strategies
router.post('/strategies', createStrategy);
router.get('/strategies/user/:userId', getUserStrategies);
router.get('/strategies/user/:userId/strategy/:strategyId', getUserStrategy);
router.put('/strategies/strategy/:strategyId', updateStrategy);
router.delete('/strategies/strategy/:strategyId', deleteStrategy);

// Injective exchange
router.get('/injective/balance/:address', getAvailableBalance);
router.post('/injective/order', placeOrder);

// Users
router.post('/v1/user/register', registerUser);
router.get('/v1/user/:wallet_id/walletId', getUserByWalletId);

export default router;
