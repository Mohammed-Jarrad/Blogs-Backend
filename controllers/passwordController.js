const asyncHandler = require("express-async-handler")
const {
	User,
	validateUpdateUser,
	validateLoginUser,
	validateEmail,
	validateNewPassword,
} = require("../models/User")
const { Post } = require("../models/Post")
const { Comment } = require("../models/Comment")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const path = require("path")
const fs = require("fs")

const sendEmail = require("../utils/sendEmail")

/** ----------------------------------------------------------------
 * @desc Send Reset Password Link
 * @route /api/password/reset-password-link
 * @method POST
 * @access public
   -----------------------------------------------------------------
 */
module.exports.sendResetPasswordLinkController = asyncHandler(async (req, res) => {
	// validation
	const { error } = validateEmail(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}
	// find user, and check if exist
	let user = await User.findOne({ email: req.body.email })
	if (!user) {
		return res.status(404).json({ message: "user not found with given email" })
	}
	// update a VT in user
	if (!user.verificationToken) {
		user.verificationToken = crypto.randomBytes(32).toString("hex")
		await user.save()
	}
	// create link
	const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${user.verificationToken}`
	// html template
	const htmlTemplate = `
        <p>
            Click <a href="${link}">here<a/> to reset your password
        </p>
    `
	// send email
	await sendEmail(user.email, "Reset Password", htmlTemplate)
	// response
	res.status(200).json({ message: "We send you a link to reset your password, check your inbox" })
})

/** ----------------------------------------------------------------
 * @desc Get Reset Password Link
 * @route /api/password/reset-password/:userId/:token
 * @method GET
 * @access public
   -----------------------------------------------------------------
 */
module.exports.getResetPasswordLinkController = asyncHandler(async (req, res) => {
	const { userId, token } = req.params

	const user = await User.findById(userId)
	if (!user) {
		return res.status(400).json({ message: "invalid link" })
	}
	if (user.verificationToken !== token) {
		return res.status(400).json({ message: "invalid link" })
	}

	res.status(200).json({ message: "valid link" })
})

/** ----------------------------------------------------------------
 * @desc Reset Password
 * @route /api/password/reset-password/:userId/:token
 * @method POST
 * @access public
   -----------------------------------------------------------------
 */
module.exports.ResetPasswordController = asyncHandler(async (req, res) => {
	const { userId, token } = req.params
	const { password } = req.body

	const { error } = validateNewPassword(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}

	const user = await User.findById(userId)
	if (!user) {
		return res.status(400).json({ message: "invalid link" })
	}
	if (!user.verificationToken) {
		return res.status(400).json({ message: "invalid link" })
	}

	if (!user.isAccountVerified) {
		user.isAccountVerified = true
	}

	// hash the pass
	const salt = await bcrypt.genSalt(10)
	const hashedPass = await bcrypt.hash(password, salt)
	// edit password in user and delete VT
	user.password = hashedPass
	user.verificationToken = ""
	await user.save()
	// response
	res.status(200).json({ message: "your password has been reset successfully" })
})
