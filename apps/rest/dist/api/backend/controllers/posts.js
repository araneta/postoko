import Post from '../models/post';
export const createPost = (req, res, next) => {
    //const post = req.body;
    const url = req.protocol + '://' + req.get('host');
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        imagePath: url + "/images/" + req.file.filename,
        creator: req.userData.userId
    });
    console.log(post);
    post.save().then((created) => {
        console.log('result', created);
        res.status(201).json({
            message: 'post added successfully',
            post: {
                id: created._id,
                title: created.title,
                content: created.content,
                imagePath: created.imagePath,
            }
        });
    }).catch(error => {
        res.status(500).json({
            message: 'Error creating post'
        });
    });
};
export const updatePost = (req, res, next) => {
    let imagePath = req.body.imagePath;
    if (req.file) {
        const url = req.protocol + "://" + req.get("host");
        imagePath = url + "/images/" + req.file.filename;
    }
    const post = {
        title: req.body.title,
        content: req.body.content,
        imagePath: imagePath,
        creator: req.userData.userId,
    };
    console.log(post);
    Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post)
        .then(result => {
        console.log('rese', result);
        if (result.matchedCount > 0) {
            res.status(200).json({ message: "Update successful!" });
        }
        else {
            res.status(401).json({ message: "Not authorized!" });
        }
    })
        .catch(error => {
        res.status(500).json({ message: "Can not update post" });
    });
};
export const getPosts = (req, res, next) => {
    console.log(req.query);
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const postQuery = Post.find();
    let fetchedPost;
    if (pageSize && currentPage) {
        postQuery.skip(pageSize * (currentPage - 1))
            .limit(pageSize);
    }
    postQuery
        .then(documents => {
        fetchedPost = documents;
        return Post.countDocuments();
    })
        .then((count) => {
        //console.log(documents);
        res.status(200).json({ message: 'success',
            posts: fetchedPost,
            maxPosts: count
        });
    }).catch(error => {
        res.status(500).json({ message: "fatch failed!" });
    });
};
export const deletePost = (req, res, next) => {
    console.log('del', req.params.id);
    Post.deleteOne({ _id: req.params.id, creator: req.userData.userId })
        .then((result) => {
        console.log(result);
        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'post deleted' });
        }
        else {
            res.status(401).json({ message: "Not authorized!" });
        }
    }).catch(error => {
        res.status(500).json({ message: "delete failed!" });
    });
    ;
};
export const getPost = (req, res, next) => {
    Post.findOne({ _id: req.params.id })
        .then((post) => {
        res.status(200).json(post);
    }).catch(error => {
        res.status(500).json({ message: "fetch post failed!" });
    });
    ;
};
