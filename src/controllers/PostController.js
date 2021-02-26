const { firebase, admin } = require('../utils/configs')

var firestore = firebase.firestore();

module.exports = {
    getAllPosts(req, res) {
        firestore.collection('posts')
            .orderBy('createdAt', 'desc')
            .get()
            .then(data => {
                var posts = []
                data.forEach(doc => {
                    posts.push({
                        postId: doc.id,
                        body: doc.data().body,
                        username: doc.data().username,
                        createdAt: doc.data().createdAt,
                        commentCount: doc.data().commentCount,
                        likeCount: doc.data().likeCount,
                        userImg: doc.data().userImg
                    })
                })
                return res.json(posts)
            })
            .catch(err => {
                res.status(500).json({ error: err.code })
            })
    },
    makeOnePost(req, res) {
        const newPost = {
            body: req.body.body,
            username: req.user.username,
            userImg: req.user.imageUrl,
            createdAt: new Date().toISOString(),
            likeCount: 0,
            commentCount: 0
        }

        firestore.collection('posts').add(newPost)
            .then(doc => {
                const resPost = newPost
                resPost.postId = doc.id
                res.json(resPost)
            })
            .catch(err => res.send(err))

    },
    getAPost(req, res) {
        var postData = {}
        admin.firestore().doc(`/posts/${req.params.postId}`).get()
            .then(doc => {
                if (!doc.exists) {
                    return res.status(404).json({ error: 'Post not found' })
                }
                postData = doc.data()
                postData.postId = doc.id
                return admin.firestore().collection('comments').orderBy('createdAt', 'desc').where('postId', '==', req.params.postId).get()
            })
            .then(data => {
                postData.comments = []
                data.forEach(doc => {
                    postData.comments.push(doc.data())
                })
                return res.json(postData)
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    },
    commentAPost(req, res) {
        const newComment = {
            body: req.body.body,
            createdAt: new Date().toISOString(),
            postId: req.params.postId,
            username: req.user.username,
            userImg: req.user.imageUrl
        }

        admin.firestore().doc(`/posts/${req.params.postId}`).get()
            .then(doc => {
                if (!doc.exists) {
                    return res.status(404).json({ error: 'Post not found' })
                }

                return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
            })
            .then(() => {
                return admin.firestore().collection('comments').add(newComment)
            })
            .then(() => {
                res.json(newComment)
            })
            .catch(err => {
                res.status(500).json({ error: 'Something went wrong' })
            })
    },
    likeAPost(req, res) {
        const likeDocument = admin.firestore().collection('likes').where('username', '==', req.user.username)
            .where('postId', '==', req.params.postId).limit(1)

        const postDocument = admin.firestore().doc(`/posts/${req.params.postId}`)

        var postData = {}

        postDocument.get()
            .then(doc => {
                if (doc.exists) {
                    postData = doc.data()
                    postData.postId = doc.id
                    return likeDocument.get()
                } else {
                    return res.status(404).json({ error: 'Post not found' })
                }
            })
            .then(data => {
                if (data.empty) {
                    return admin.firestore().collection('likes').add({
                        postId: req.params.postId,
                        username: req.user.username
                    })
                        .then(() => {
                            postData.likeCount++
                            return postDocument.update({ likeCount: postData.likeCount })
                        })
                        .then(() => {
                            return res.json(postData)
                        })
                } else {
                    return res.status(400).json({ error: 'Post already liked' })
                }
            })
            .catch(err => {
                res.status(500).json({ error: err.code })
            })
    },
    unlikeAPost(req, res) {
        const likeDocument = admin.firestore().collection('likes').where('username', '==', req.user.username)
            .where('postId', '==', req.params.postId).limit(1)

        const postDocument = admin.firestore().doc(`/posts/${req.params.postId}`)

        var postData = {}

        postDocument.get()
            .then(doc => {
                if (doc.exists) {
                    postData = doc.data()
                    postData.postId = doc.id
                    return likeDocument.get()
                } else {
                    return res.status(404).json({ error: 'Post not found' })
                }
            })
            .then(data => {
                if (data.empty) {
                    return res.status(400).json({ error: 'Post not liked' })
                } else {
                    return admin.firestore().doc(`/likes/${data.docs[0].id}`).delete()
                        .then(() => {
                            postData.likeCount--
                            return postDocument.update({ likeCount: postData.likeCount })
                        })
                        .then(() => {
                            res.json(postData)
                        })
                }
            })
            .catch(err => {
                res.status(500).json({ error: err.code })
            })
    },
    deleteAPost(req, res) {
        const document = admin.firestore().doc(`/posts/${req.params.postId}`)
        document.get()
            .then(doc => {
                if (!doc.exists) {
                    return res.status(404).json({ error: 'Post not found' })
                }
                if (doc.data().username !== req.user.username) {
                    return res.status(403).json({ error: 'Unauthorized' })
                } else {
                    return document.delete()
                }
            })
            .then(() => {
                res.json({ message: 'Post deleted successfully' })
            })
            .catch(err => {
                return res.status(500).json({ error: err.code })
            })
    }
}