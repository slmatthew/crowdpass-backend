import { Router } from 'express';
import * as oc from '@api/controllers/admin/organizersController';

const router = Router();

router.get('/', oc.getAllOrganizers);
router.get('/available', oc.getAvailableOrganizers);
router.get('/me', oc.getMyOrganizer);
router.get('/:id', oc.getOrganizerById);

router.patch('/:id', oc.updateOrganizer);
router.post('/', oc.createOrganizer);

router.delete('/:id', oc.deleteOrganizer);

export default router;