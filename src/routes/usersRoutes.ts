import express from "express";
import {
	createUser,
	deleteUser,
	fetchUser,
	fetchUsers,
	updateUser,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", fetchUsers);
router.get("/:id", fetchUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
