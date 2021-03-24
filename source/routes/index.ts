import { Router } from 'express';
import {
  getUsersCtrl,
  getUserByIdCtrl,
  createUsersCtrl,
  updateUserCtrl,
  // createRoomCtrl,
  // joinRoomCtrl
} from './controllers';

const router = Router();

router.get('/user', getUsersCtrl);
router.get('/user/:userId', getUserByIdCtrl);
// TODO: Connect with Firebase Auth when ready - Firebase will handle email validation
router.post('/user/create', createUsersCtrl);
router.post('/user/:field/:userId', updateUserCtrl);
// TODO: Time permitting - Delete User, Update Username | Email

// router.post('/room/create', createRoomCtrl);

// router.post('/room/:roomId/join', joinRoomCtrl);

export default router;