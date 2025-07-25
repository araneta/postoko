import mongoose, { Schema } from 'mongoose';
const postSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imagePath: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});
const Post = mongoose.model('Post', postSchema);
export default Post;
