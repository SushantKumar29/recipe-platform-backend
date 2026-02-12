import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Only image files are allowed"));
	}
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
}).any();

interface MulterError extends Error {
	code?: string;
}

export const uploadSingleImage = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	upload(req, res, (err: unknown) => {
		if (err) {
			const multerError = err as MulterError;

			if (multerError.code === "LIMIT_FILE_SIZE") {
				return res.status(400).json({
					message: "File size too large. Maximum size is 10MB",
				});
			}

			return res.status(400).json({
				message: multerError.message || "Error uploading file",
			});
		}

		const multerReq = req as Express.Request & { files: Express.Multer.File[] };
		if (multerReq.files && multerReq.files.length > 0) {
			multerReq.file = multerReq.files[0];
		}

		next();
	});
};
