import express from 'express';
import * as listController from '../controllers/listController.js';
import * as storyController from '../controllers/storyController.js';
import * as commentController from '../controllers/commentController.js';
import * as userController from '../controllers/userController.js';
import { checkTokenMiddleware } from '../middlewares/checkTokenNotValid.js';
import {
  uploadPostImagesMiddleware,
  validateUploadedImages,
} from "../middlewares/uploadPostImagesMiddleware.js";
import { loginLimiter, registerLimiter, uploadLimiter } from "../middlewares/security.js";

const router = express.Router();

router.get('/list', checkTokenMiddleware, listController.getList);
router.get('/list/:id', checkTokenMiddleware, listController.getListStatusOfOneUser);
router.get('/list-user/:id', checkTokenMiddleware, listController.getListUserStatusByUserId);
router.get('/story', checkTokenMiddleware, storyController.getStory);
router.post(
  '/story',
  checkTokenMiddleware,
  uploadLimiter,
  uploadPostImagesMiddleware.single('image'),
  validateUploadedImages,
  storyController.createStory
);
router.delete('/story/expired', checkTokenMiddleware, storyController.deleteExpiredStories);
router.delete('/story/:id', checkTokenMiddleware, storyController.deleteStory);
router.get('/comment', checkTokenMiddleware, commentController.getComment);
router.get('/comment/:id', checkTokenMiddleware, commentController.getCommentByListId);
router.get('/send-friend/:id', checkTokenMiddleware, userController.getListSendFriend);

//Test
router.get('/user/:id', checkTokenMiddleware, userController.getUserFriendOfLoginUser);
router.get('/search-user', checkTokenMiddleware, userController.searchUsers);
router.post('/login', loginLimiter, userController.loginUserByEmailAndPassword);
router.post('/logout', userController.logoutAndRemoveAllToken);
router.post('/refesh-token', userController.refreshTokenWhenExpired);
router.get('/list-friend/:id', checkTokenMiddleware, userController.getListFriendViaUserId);
router.post('/register', registerLimiter, userController.createNewUser)
router.put('/user/:id', checkTokenMiddleware, userController.updateAvatarOfUser);
router.put('/update-add-friend/:id/:id2', checkTokenMiddleware, userController.updateAddFriend);
router.post("/send-friend-request", checkTokenMiddleware, userController.sendFriendRequest);
router.delete("/friendship/:id", checkTokenMiddleware, userController.cancelFriendship);
router.delete("/friend-request/:id", checkTokenMiddleware, userController.cancelFriendRequest);

router.post("/add-comment/:userId/:listId", checkTokenMiddleware, commentController.addComment);
router.post(
  "/upload-post-images",
  checkTokenMiddleware,
  uploadLimiter,
  uploadPostImagesMiddleware.array(
    "images",
    10
  ),
  validateUploadedImages,
  listController.uploadPostImages
);

router.post("/add-post", checkTokenMiddleware, listController.createNewPost);

router.put(
  "/update-post/:id",
  checkTokenMiddleware,
  uploadLimiter,
  uploadPostImagesMiddleware.array(
    "images",
    10
  ),
  validateUploadedImages,
  listController.updatePost
);

router.delete(
  "/delete-post/:id",
  checkTokenMiddleware,
  listController.deletePost
);

export default router;
