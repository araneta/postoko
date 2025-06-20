import User from '../models/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
export const createUser = (req, res, next) => {
    console.log('user signup');
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
        const user = new User({
            email: req.body.email,
            password: hash
        });
        user.save()
            .then(result => {
            console.log(result);
            res.status(201).json({
                message: 'User created successfully'
            });
        })
            .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    });
};
export const userLogin = (req, res, next) => {
    console.log('user login');
    User.findOne({ email: req.body.email })
        .then(user => {
        if (!user) {
            return res.status(401).json({
                message: 'Auth failed'
            });
        }
        return bcrypt.compare(req.body.password, user.password)
            .then(result => {
            if (!result) {
                return res.status(401).json({
                    message: 'Auth failed'
                });
            }
            const token = jwt.sign({ email: user.email, userId: user._id, }, process.env.JWT, { expiresIn: '1h' });
            res.status(200).json({
                token: token,
                userId: user._id,
                expiresIn: 3600
            });
        })
            .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    });
};
