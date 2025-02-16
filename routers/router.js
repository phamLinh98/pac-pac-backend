import express from 'express';
import * as listController from '../controllers/listController.js';
import * as storyController from '../controllers/storyController.js';
import * as commentController from '../controllers/commentController.js';
import * as userController from '../controllers/userController.js';
import { checkTokenMiddleware } from '../middlewares/checkTokenNotValid.js';

const router = express.Router();

router.get('/list', checkTokenMiddleware, listController.getList);
router.get('/list/:id', checkTokenMiddleware, listController.getListStatusOfOneUser);

router.get('/story', checkTokenMiddleware, storyController.getStory);
router.get('/comment', checkTokenMiddleware, commentController.getComment);
router.get('/comment/:id', checkTokenMiddleware, commentController.getCommentByListId);

router.get('/user/:id', checkTokenMiddleware, userController.getUserFriendOfLoginUser);
router.post('/login', userController.loginUserByEmailAndPassword);
router.get('/logout', userController.logoutAndRemoveAllToken);
router.get('/refesh-token', userController.refreshTokenWhenExpired);
router.get('/list-friend/:id', userController.getListFriendViaUserId);

export default router;