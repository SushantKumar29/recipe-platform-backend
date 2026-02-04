import express from "express";
import {
	createComment,
	deleteComment,
	updateComment,
} from "../controllers/commentsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, createComment);
router.put("/:id", requireAuth, updateComment);
router.delete("/:id", requireAuth, deleteComment);

export default router;
