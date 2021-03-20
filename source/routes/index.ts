import { Router } from 'express';
import {
  getUsersCtrl,
  getUserByIdCtrl,
  createUsersCtrl,
  updateUserScoreCtrl
} from './controllers';

const router = Router();

router.get('/user', getUsersCtrl);
router.get('/user/:userId', getUserByIdCtrl);

// TODO: Connect with Firebase Auth when ready - Firebase will handle email validation
// TODO: Add guest flag to user model
router.post('/user/create', createUsersCtrl);

// TODO: Update Score
router.put('user/score', updateUserScoreCtrl);

// TODO: Update Longest Word


export default router;