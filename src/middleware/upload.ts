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

export const uploadSingleImage = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	upload(req, res, (err: any) => {
		if (err) {
			if (err.code === "LIMIT_FILE_SIZE") {
				return res.status(400).json({
					message: "File size too large. Maximum size is 10MB",
				});
			}

			return res.status(400).json({
				message: err.message || "Error uploading file",
			});
		}

		if ((req as any).files && (req as any).files.length > 0) {
			req.file = (req as any).files[0];
		}

		next();
	});
};
