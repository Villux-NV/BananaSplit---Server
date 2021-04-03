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

router.post('/user/word/:userId', updateUserWordCtrl);
router.post('/user/score/:userId', updateUserScoreCtrl);

export default router;