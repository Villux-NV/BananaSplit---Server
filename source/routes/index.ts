import { Router } from 'express';
import {
  getUsersCtrl,
  getUserByIdCtrl,
  createUsersCtrl,
  updateUserCtrl,
} from './controllers';

const router = Router();

router.get('/user', getUsersCtrl);
router.get('/user/:userId', getUserByIdCtrl);

router.post('/user/create', createUsersCtrl);

// TODO: Refactor for two separate updates-Word & Score 
router.post('/user/:field/:userId', updateUserCtrl);

// TODO: Time permitting - Delete User, Update Username | Email

export default router;