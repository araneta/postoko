import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const MIME_TYPES: { [key: string]: string } = {
	'image/png': 'png',
	'image/jpg': 'jpg',
	'image/jpeg': 'jpg',
};

const storage = multer.diskStorage({
	destination: (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		const isValid = MIME_TYPES[file.mimetype];
		let error: Error | null = new Error('invalid mime types');
		if (isValid) {
			error = null;
		}
		cb(error, 'backend/images');
	},
	filename: (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, filename: string) => void
	) => {
		const name = file.originalname.toLowerCase();
		const ext = MIME_TYPES[file.mimetype];
		cb(null, name + '-' + Date.now() + '.' + ext);
	},
});

const fileMiddleware = multer({ storage: storage }).single('image');
export default fileMiddleware;
