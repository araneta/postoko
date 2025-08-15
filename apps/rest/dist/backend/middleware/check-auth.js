import jwt from 'jsonwebtoken';
const checkAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'token missing' });
    }
    jwt.verify(token, process.env.JWT, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'token invalid' });
        }
        req.userData = { email: decodedToken.email, userId: decodedToken.userId };
        next();
    });
};
export default checkAuth;
