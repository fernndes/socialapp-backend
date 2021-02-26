const { firebase, admin } = require('../utils/configs')

const auth = firebase.auth()

module.exports = {
    startNewSession(req, res) {
        const user = {
            email: req.body.email,
            password: req.body.password
        }

        auth.signInWithEmailAndPassword(user.email, user.password)
            .then((data) => {
                return data.user.getIdToken()
            })
            .then((token) => {
                return res.json({ token })
            })
            .catch((error) => {
                return res.status(403).json({ general: 'Wrong credential, please try again' })
            })
    }
}