import mongoose, { Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
userSchema.plugin(uniqueValidator);
const User = mongoose.model('User', userSchema);
export default User;
