const asyncHandler = require("express-async-handler")
const bcrypt = require("bcryptjs")
const { User, validateRegisterUser, validateLoginUser } = require("../models/User")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")

/** ----------------------------------------------------------------
 * @desc Register New User - Sign Up
 * @route /api/auth/register
 * @method POST
 * @access public
   -----------------------------------------------------------------
 */
module.exports.registerUserController = asyncHandler(async (req, res) => {
	const { error } = validateRegisterUser(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}

	let user = await User.findOne({ email: req.body.email })
	if (user) {
		return res.status(400).json({ message: "User already exist" })
	}

	const salt = await bcrypt.genSalt(10)
	const hashedPassword = await bcrypt.hash(req.body.password, salt)

	// create random token
	const verificationToken = crypto.randomBytes(32).toString("hex")

	// create new user with custom verification token
	const newUser = await User.create({
		username: req.body.username,
		email: req.body.email,
		password: hashedPassword,
		verificationToken,
	})

	const clientDomain = process.env.CLIENT_DOMAIN
	const link = `${clientDomain}/verify/${verificationToken}`
	const htmlTemplate = `
            <p>
                Click
                <a href="${link}">Here<a/>
                to Verify your account.
            </p>
        `

	await sendEmail(newUser.email, "Verification Account", htmlTemplate)

	return res
		.status(201)
		.json({ message: "We sent to you an email, Please verify your email address" })
})

/** ----------------------------------------------------------------
 * @desc Log In User
 * @route /api/auth/login
 * @method POST
 * @access public
   -----------------------------------------------------------------
 */

module.exports.loginUserController = asyncHandler(async (req, res) => {
	const { error } = validateLoginUser(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}

	let user = await User.findOne({ email: req.body.email })
	if (!user) {
		return res.status(400).json({ message: "invalid email or password" })
	}

	const isPasswordMatch = await bcrypt.compare(req.body.password, user.password)
	if (!isPasswordMatch) {
		return res.status(400).json({ message: "invalid email or password" })
	}

	// Sending email (verify accoount if not verified)
	if (!user.isAccountVerified) {
		let { verificationToken } = user
		const clientDomain = process.env.CLIENT_DOMAIN
		const link = `${clientDomain}/verify/${verificationToken}`
		const htmlTemplate = `
            <p>
                Click
                <a href="${link}">Here<a/>
                to Verify your account.
            </p>
        `
		await sendEmail(user.email, "Verification Account", htmlTemplate)

		return res
			.status(400)
			.json({ message: "we sent to you an email, please verify your email address" })
	}

	const token = user.generateAuthToken()

	res.status(200).json({
		_id: user._id,
		username: user.username,
		isAdmin: user.isAdmin,
		profilePhoto: user.profilePhoto,
		token,
	})
})

/** ----------------------------------------------------------------
 * @desc Verify User Account
 * @route /api/auth/verify/:token
 * @method GET
 * @access public
   -----------------------------------------------------------------
 */

module.exports.verifyUserAccountController = asyncHandler(async (req, res) => {
	const { token } = req.params
	const user = await User.findOne({ verificationToken: token })

	if (!user) return res.status(400).json({ message: "invalid link (no user)" })

	await User.updateOne(
		{
			_id: user._id,
		},
		{
			$set: {
				isAccountVerified: true,
				verificationToken: "",
			},
		},
		{
			new: true,
		},
	)

	res.status(200).json({ message: "your account has been verified successfully" })
})
