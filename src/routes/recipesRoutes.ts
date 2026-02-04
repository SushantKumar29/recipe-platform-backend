import express from "express";
import {
	fetchRecipes,
	fetchRecipe,
	createRecipe,
	updateRecipe,
	deleteRecipe,
} from "../controllers/recipesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", fetchRecipes);
router.get("/:id", fetchRecipe);

router.post("/", requireAuth, createRecipe);
router.put("/:id", requireAuth, updateRecipe);
router.delete("/:id", requireAuth, deleteRecipe);

export default router;
