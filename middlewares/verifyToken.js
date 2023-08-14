const jwt = require("jsonwebtoken")

// verify Token
function verifyToken(req, res, next) {
	const authToken = req.headers.authorization
	if (authToken) {
		const token = authToken.split(" ")[1]
		try {
			const decodedPayload = jwt.verify(token, process.env.JWT_SECRET)
			req.user = decodedPayload
			next()
		} catch (error) {
			res.status(401).json({ message: "invalid token, access denied" })
		}
	} else {
		res.status(401).json({ message: "no token provided, access denied" })
	}
}

// verify Token &  Admin
function verifyTokenAndAdmin(req, res, next) {
	verifyToken(req, res, () => {
		if (!req.user.isAdmin) {
			return res.status(403).json({ message: "you must be an admin" })
		}
		next()
	})
}
// verify Token &  Only User Himself
function verifyTokenAndOnlyUser(req, res, next) {
	verifyToken(req, res, () => {
		if (req.user.id !== req.params.id) {
			return res.status(403).json({ message: "not allowed, only user himself" })
		}
		next()
	})
}

// verify Token & Admin & User Himself
function verifyTokenAndAdminOrOnlyUser(req, res, next) {
	verifyToken(req, res, () => {
		if (req.user.id == req.params.id || req.user.isAdmin) {
			next()
		} else {
			res.status(403).json({ message: "not allowed, only user himself or admin" })
		}
	})
}

module.exports = {
	verifyToken,
	verifyTokenAndAdmin,
	verifyTokenAndOnlyUser,
	verifyTokenAndAdminOrOnlyUser,
}
