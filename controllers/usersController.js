const asyncHandler = require('express-async-handler')
const { User, validateUpdateUser, validateLoginUser } = require('../models/User')
const { Post } = require('../models/Post')
const { Comment } = require('../models/Comment')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')
const {
	cloudinaryRemoveImage,
	cloudinaryUploadImage,
	cloudinaryRemoveMultipleImages,
} = require('../utils/cloudinary')

/** ----------------------------------------------------------------
 * @desc Get All Users Profile
 * @route /api/users/profile
 * @method GET
 * @access private (only admin)
   -----------------------------------------------------------------
 */
module.exports.getAllUsersController = asyncHandler(async (req, res) => {
	const users = await User.find().select('-password').populate('posts')
	res.status(200).json(users)
})

/** ----------------------------------------------------------------
 * @desc Get User Profile
 * @route /api/users/profile/:id
 * @method GET
 * @access public
   -----------------------------------------------------------------
 */
module.exports.getUserController = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id)
		.select('-password')
		.populate({
			path: 'posts',
			populate: {
				path: 'user',
				select: '_id username email profilePhoto',
			},
		})
		.populate({
			path: 'posts',
			populate: {
				path: 'likes',
				select: '-password',
			},
		})

	if (!user) {
		return res.status(404).json({ message: 'User Not Found' })
	}
	res.status(200).json(user)
})

/** ----------------------------------------------------------------
 * @desc Update User Profile
 * @route /api/users/profile/:id
 * @method PUT
 * @access private (only user himself)
   -----------------------------------------------------------------
 */
module.exports.updateUserController = asyncHandler(async (req, res) => {
	const { error } = validateUpdateUser(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}

	if (req.body.password) {
		const salt = await bcrypt.genSalt(10)
		req.body.password = await bcrypt.hash(req.body.password, salt)
	}

	const updatedUser = await User.findByIdAndUpdate(
		req.params.id,
		{
			$set: {
				username: req.body.username,
				password: req.body.password,
				bio: req.body.bio,
			},
		},
		{ new: true },
	)
		.select('-password')
		.populate({
			path: 'posts',
			populate: {
				path: 'user',
				select: '-password',
			},
		})
		.populate({
			path: 'posts',
			populate: {
				path: 'likes',
				select: '-password',
			},
		})

	res.status(200).json(updatedUser)
})

/** ----------------------------------------------------------------
 * @desc Get Users Count
 * @route /api/users/count
 * @method GET
 * @access private (only admin)
   -----------------------------------------------------------------
 */
module.exports.getUsersCountController = asyncHandler(async (req, res) => {
	const count = await User.count()
	res.status(200).json(count)
})

/** ----------------------------------------------------------------
 * @desc Profile Photo Upload
 * @route /api/users/profile/profile-photo-upload
 * @method POST
 * @access private (only logged in user)
   -----------------------------------------------------------------
 */
module.exports.profilePhotoUploadController = asyncHandler(async (req, res) => {
	// validation
	if (!req.file) {
		return res.status(400).json({ message: 'no file provided' })
	}
	// upload to cloudinary
	const result = await cloudinaryUploadImage(req.file.buffer, req.file.mimetype)
	// get the user from DB
	const user = await User.findById(req.user.id)
	// delete the old profile photo if exist
	if (user.profilePhoto.publicId !== null) {
		await cloudinaryRemoveImage(user.profilePhoto.publicId)
	}
	// change the profile photo feild in the DB
	user.profilePhoto = new Object({
		url: result.secure_url,
		publicId: result.public_id,
	})
	await user.save()
	// send response to client
	res.status(200).json({
		message: 'your profile photo uploaded successfully',
		profilePhoto: {
			url: result.secure_url,
			publicId: result.public_id,
		},
	})
})

/** ----------------------------------------------------------------
 * @desc Delete User Profile (Account) 
 * @route /api/users/profile/:id
 * @method DELETE
 * @access private (admin or only logged in user)
   -----------------------------------------------------------------
 */
module.exports.deleteUserProfileController = asyncHandler(async (req, res) => {
	// Get the user from DB
	const user = await User.findById(req.params.id)
	if (!user) {
		return res.status(404).json({ message: 'users not found' })
	}
	// Get All Posts from DBs
	const posts = await Post.find({ user: user._id })
	// Get the public Id's from the posts of this user
	const publicIds = posts?.map(post => post.image.publicId)
	// delete all post image from cloudinary that belong to this user
	posts?.length > 0 && (await cloudinaryRemoveMultipleImages(publicIds))
	// delete the profile picture from the cloudinary
	user.profilePhoto.publicId && (await cloudinaryRemoveImage(user.profilePhoto.publicId))
	// delete user posts and comments
	await Post.deleteMany({ user: user._id })
	await Comment.deleteMany({ user: user._id })
	// delete UserId from all Posts he liked it
	await Post.updateMany(
		{
			likes: user._id,
		},
		{
			$pull: {
				likes: user._id,
			},
		},
		{ new: true },
	)
	// delete the user himself
	await User.findByIdAndDelete(req.params.id)
	// send a response to the client
	res.status(200).json({ message: 'your profile has been deleted' })
})
