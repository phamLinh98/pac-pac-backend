import express from 'express';
import * as listController from '../controllers/listController.js';
import * as storyController from '../controllers/storyController.js';
const router = express.Router();

router.get('/list', listController.getList);
router.get('/story', storyController.getStory);

export default router;