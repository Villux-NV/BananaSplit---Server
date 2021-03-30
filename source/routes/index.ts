import { Router } from 'express';
import {
  getUsersCtrl,
  getUserByIdCtrl,
  createUsersCtrl,
  updateUserWordCtrl,
  updateUserScoreCtrl
} from './controllers';

const router = Router();

router.get('/user', getUsersCtrl);
router.get('/user/:userId', getUserByIdCtrl);

router.post('/user/create', createUsersCtrl);

// TODO: Refactor for two separate updates-Word & Score 
router.post('/user/word/:userId', updateUserWordCtrl);
router.post('/user/score/:userId', updateUserScoreCtrl);

// TODO: Time permitting - Delete User, Update Username | Email

export default router;