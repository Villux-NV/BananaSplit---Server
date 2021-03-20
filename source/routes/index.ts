import { Router } from 'express';
import { getUsersCtrl, getUserByIdCtrl, createUsersCtrl } from './controllers';

const router = Router();

router.get('/users', getUsersCtrl);
router.get('/users/:userId', getUserByIdCtrl);

router.post('/users/create/:profileId', createUsersCtrl);

export default router;