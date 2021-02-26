const { firebase, admin } = require('../utils/configs')

var firestore = firebase.firestore();
var auth = firebase.auth()

module.exports = {
    createAnAccount(req, res) {
        const newUser = {
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
            username: req.body.username,
        }

        var token, userId

        firestore.doc(`/users/${newUser.username}`).get()
            .then(doc => {
                if (doc.exists) {
                    return res.status(400).json({ username: 'this username is not available' })
                } else {
                    return auth.createUserWithEmailAndPassword(newUser.email, newUser.password)
                }
            })
            .then((data) => {
                userId = data.user.uid
                return data.user.getIdToken()
            })
            .then((idToken) => {
                token = idToken
                const userCredentials = {
                    username: newUser.username,
                    email: newUser.email,
                    createdAt: new Date().toISOString(),
                    imageUrl: `https://firebasestorage.googleapis.com/v0/b/${process.env.storageBucket}/o/no-img.png?alt=media`,
                    userId
                }

                return firestore.doc(`/users/${newUser.username}`).set(userCredentials)
            })
            .then(() => {
                return res.status(201).json({ token })
            })
            .catch(err => {
                if (err.code === "auth/email-already-in-use") {
                    return res.status(400).json({ error: 'Email is already in use' })
                } else {
                    return res.status(500).json({ general: 'Something is wrong, please try again' })
                }
            })
    },
    addUserDetails(req, res) {
        const extraInfo = {
            bio: req.body.bio,
            location: req.body.location
        }
        firestore.doc(`/users/${req.user.username}`).update(extraInfo)
            .then(() => {
                return res.json({ message: 'Extra data added succesfully' })
            })
            .catch(err => {
                return res.status(500).json({ error: err.code })
            })
    },
    uploadImage(req, res) {
        const bucket = admin.storage().bucket()

        const uploadImageToStorage = (file) => {
            return new Promise((resolve, reject) => {
                const { v4: uuid } = require("uuid")

                var generatedToken = uuid();
                if (!file) {
                    reject('No image file');
                }
                let newFileName = `${file.originalname.split(".")[0]}_${Date.now()}`;

                let fileUpload = bucket.file(newFileName)

                const blobStream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                        firebaseStorageDownloadTokens: generatedToken
                    }
                });

                blobStream.on('error', (error) => {
                    console.log(error)
                    reject('Something is wrong! Unable to upload at the moment.');
                });

                blobStream.on('finish', () => {
                    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUpload.name}?alt=media&token=${generatedToken}`
                    resolve(imageUrl);
                });

                blobStream.end(file.buffer);
            });
        }

        let file = req.file;
        if (file) {
            console.log('File here')
            uploadImageToStorage(file).then((success) => {
                return admin.firestore().doc(`/users/${req.user.username}`).update({ imageUrl: success });
            }).then(() => {
                return res.json({ message: "image uploaded successfully" });
            }).catch((error) => {
                console.error(error);
            });
        }
    },
    getAuthenticatedUser(req, res) {
        var userData = {};
        admin.firestore().doc(`/users/${req.user.username}`).get()
            .then(doc => {
                if (doc.exists) {
                    userData.credentials = doc.data()
                    return admin.firestore().collection('likes').where('username', '==', req.user.username).get()
                }
            })
            .then(data => {
                userData.likes = []
                data.forEach(doc => {
                    userData.likes.push(doc.data())
                })
                return res.json(userData)
            })
            .catch(err => {
                return res.status(500).json({ error: err.code })
            })
    },
    getUserDetails(req, res) {
        var userData = {}
        admin.firestore().doc(`/users/${req.params.username}`)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    userData.user = doc.data();
                    return admin.firestore()
                        .collection("posts")
                        .where("username", "==", req.params.username)
                        .orderBy("createdAt", "desc")
                        .get();
                } else {
                    return res.status(404).json({ errror: "User not found" });
                }
            })
            .then((data) => {
                userData.posts = [];
                data.forEach((doc) => {
                    userData.posts.push({
                        body: doc.data().body,
                        createdAt: doc.data().createdAt,
                        username: doc.data().username,
                        userImg: doc.data().userImg,
                        likeCount: doc.data().likeCount,
                        commentCount: doc.data().commentCount,
                        screamId: doc.id,
                    });
                });
                return res.json(userData);
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).json({ error: err.code });
            });
    }
}