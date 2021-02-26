const { firebase, admin } = require('../utils/configs')

var firestore = firebase.firestore();

module.exports = {
    fbAuth(req, res, next) {
        var idToken;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            idToken = req.headers.authorization.split('Bearer ')[1];
        } else {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        admin
            .auth()
            .verifyIdToken(idToken)
            .then((decodedToken) => {
                req.user = decodedToken;
                return firestore
                    .collection('users')
                    .where('userId', '==', req.user.uid)
                    .limit(1)
                    .get();
            })
            .then((data) => {
                req.user.username = data.docs[0].data().username;
                req.user.imageUrl = data.docs[0].data().imageUrl;
                return next();
            })
            .catch((err) => {
                return res.status(403).json(err);
            });
    }
}