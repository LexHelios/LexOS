import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import workOrderRoutes from './workOrder.routes';
import tenantRoutes from './tenant.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/tenants', tenantRoutes);

export default router; 