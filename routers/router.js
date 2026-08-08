import express from 'express';
import * as listController from '../controllers/listController.js';
import * as storyController from '../controllers/storyController.js';
import * as commentController from '../controllers/commentController.js';
import * as userController from '../controllers/userController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as chatController from '../controllers/chatController.js';
import * as likeController from '../controllers/likeController.js';
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
router.get('/profile-media', checkTokenMiddleware, userController.getProfileMedia);
router.put(
  '/profile-image',
  checkTokenMiddleware,
  uploadLimiter,
  uploadPostImagesMiddleware.single('image'),
  validateUploadedImages,
  userController.updateProfileImage
);
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
router.post('/posts/:postId/like', checkTokenMiddleware, likeController.togglePostLike);
router.get(
  "/notifications/comments",
  checkTokenMiddleware,
  notificationController.getCommentNotifications
);
router.patch(
  "/notifications/read-all",
  checkTokenMiddleware,
  notificationController.markAllCommentNotificationsAsRead
);
router.get('/chats', checkTokenMiddleware, chatController.getChats);
router.post('/chats/direct', checkTokenMiddleware, chatController.createDirectChat);
router.post('/chats/group', checkTokenMiddleware, chatController.createGroupChat);
router.get('/chats/:id/messages', checkTokenMiddleware, chatController.getMessages);
router.post('/chats/:id/messages', checkTokenMiddleware, chatController.sendMessage);
router.patch('/chats/:id/read', checkTokenMiddleware, chatController.markRead);
router.post('/chats/:id/members', checkTokenMiddleware, chatController.addMembers);
router.delete('/chats/:id/members/me', checkTokenMiddleware, chatController.leaveGroup);
router.patch(
  "/notifications/:id/read",
  checkTokenMiddleware,
  notificationController.markNotificationAsRead
);
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
