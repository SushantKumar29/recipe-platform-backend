import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.ts";

export const uploadToCloudinary = (
	file: Express.Multer.File,
): Promise<UploadApiResponse | UploadApiErrorResponse> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: "recipe-images",
				resource_type: "auto",
				transformation: [
					{ width: 1000, height: 1000, crop: "limit" },
					{ quality: "auto:good" },
				],
			},
			(error, result) => {
				if (error) {
					reject(error);
				} else if (result) {
					resolve(result);
				}
			},
		);

		uploadStream.end(file.buffer);
	});
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
	try {
		await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		console.error("Error deleting image from Cloudinary:", error);
	}
};
