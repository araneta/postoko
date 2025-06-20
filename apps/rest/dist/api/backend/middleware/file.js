import multer from 'multer';
const MIME_TYPES = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPES[file.mimetype];
        let error = new Error('invalid mime types');
        if (isValid) {
            error = null;
        }
        cb(error, 'backend/images');
    },
    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase();
        const ext = MIME_TYPES[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    },
});
const fileMiddleware = multer({ storage: storage }).single('image');
export default fileMiddleware;
