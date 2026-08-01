import express from 'express';
import * as listController from '../controllers/listController.js';
import * as storyController from '../controllers/storyController.js';
import * as commentController from '../controllers/commentController.js';
import * as userController from '../controllers/userController.js';
import { checkTokenMiddleware } from '../middlewares/checkTokenNotValid.js';
import {
  uploadPostImagesMiddleware,
} from "../middlewares/uploadPostImagesMiddleware.js";

const router = express.Router();

router.get('/list', checkTokenMiddleware, listController.getList);
router.get('/list/:id', checkTokenMiddleware, listController.getListStatusOfOneUser);
router.get('/list-user/:id', checkTokenMiddleware, listController.getListUserStatusByUserId);
router.get('/story', storyController.getStory);
router.get('/comment', checkTokenMiddleware, commentController.getComment);
router.get('/comment/:id', checkTokenMiddleware, commentController.getCommentByListId);
router.get('/send-friend/:id', checkTokenMiddleware, userController.getListSendFriend);

//Test
router.get('/user/:id', checkTokenMiddleware, userController.getUserFriendOfLoginUser);
router.post('/login', userController.loginUserByEmailAndPassword);
router.get('/logout', userController.logoutAndRemoveAllToken);
router.get('/refesh-token', userController.refreshTokenWhenExpired);
router.get('/list-friend/:id', userController.getListFriendViaUserId);
router.post('/register', userController.createNewUser)
router.put('/user/:id', userController.updateAvatarOfUser);
router.put('/update-add-friend/:id/:id2', checkTokenMiddleware, userController.updateAddFriend);
router.post("/send-friend-request", checkTokenMiddleware, userController.sendFriendRequest);

router.post("/add-comment/:userId/:listId", checkTokenMiddleware, commentController.addComment);
router.post('/add-post', checkTokenMiddleware, listController.createNewPost);
router.post(
  "/upload-post-images",
  checkTokenMiddleware,
  uploadPostImagesMiddleware.array(
    "images",
    10
  ),
  listController.uploadPostImages
);

router.post(
  "/add-post",
  checkTokenMiddleware,
  listController.createNewPost
);

router.put(
  "/update-post/:id",
  checkTokenMiddleware,
  uploadPostImagesMiddleware.array(
    "images",
    10
  ),
  listController.updatePost
);

router.delete(
  "/delete-post/:id",
  checkTokenMiddleware,
  listController.deletePost
);

export default router;
