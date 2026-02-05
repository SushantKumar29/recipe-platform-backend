import type { Request, Response } from "express";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const PORT = process.env.PORT || 3000;

const router = express.Router();
const options: swaggerJSDoc.Options = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Recipe Platform API",
			version: "1.0.0",
			description: "API documentation for Recipe Platform",
		},
		tags: [
			{
				name: "Recipes",
				description: "Operations related to recipes",
			},
			{
				name: "Auth",
				description: "Operations related to authentication",
			},
			{
				name: "Comments",
				description: "Operations related to comments",
			},
		],
		servers: [
			{
				url: `http://localhost:${PORT}/api/v1`,
				description: "Development server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					descriptions: "JWT token authorization",
				},
			},
		},
	},
	apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

router.get("/json", (req: Request, res: Response) => {
	res.setHeader("Content-Type", "application/json");
	res.send(swaggerSpec);
});
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
