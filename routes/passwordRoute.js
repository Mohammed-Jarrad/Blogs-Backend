const { sendResetPasswordLinkController, getResetPasswordLinkController, ResetPasswordController } = require("../controllers/passwordController")

const router = require("express").Router()

// /api/password/reset-password-link
router.post("/reset-password-link", sendResetPasswordLinkController)

// /api/password/reset-password/:userId/:token
router.route('/reset-password/:userId/:token')
	.get(getResetPasswordLinkController)
	.post(ResetPasswordController)

module.exports = router
