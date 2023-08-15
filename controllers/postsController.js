const asyncHandler = require("express-async-handler")
const { Post, validateCreatePost, validateUpdatePost } = require("../models/Post")
const bcrypt = require("bcryptjs")
const path = require("path")
const fs = require("fs")
const { cloudinaryRemoveImage, cloudinaryUploadImage } = require("../utils/cloudinary")
const { default: mongoose } = require("mongoose")
const { Comment } = require("../models/Comment")

/** ----------------------------------------------------------------
 * @desc Create New Post
 * @route /api/posts
 * @method POST
 * @access private (only logged in user)
   -----------------------------------------------------------------
 */
module.exports.createPostController = asyncHandler(async (req, res) => {
	// Validation for image
	if (!req.file) {
		return res.status(400).json({ message: "no image provided" })
	}
	// Validation for data
	const { error } = validateCreatePost(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}
	// upload photo
	const result = await cloudinaryUploadImage(req.file.buffer, req.file.mimetype)
	// create new post and save it to DB
	const { title, category, description } = req.body
	const post = await Post.create({
		title,
		category,
		description,
		user: req.user.id,
		image: {
			url: result.secure_url,
			publicId: result.public_id,
		},
	})

	// send response to the client
	res.status(201).json({ post, message: "Your post has been created successfully" })
})

/** ----------------------------------------------------------------
 * @desc Get All Posts
 * @route /api/posts
 * @method GET
 * @access public
   -----------------------------------------------------------------
 */

module.exports.getAllPostsController = asyncHandler(async (req, res) => {
	const POST_PER_PAGE = 3
	const { pageNumber, category } = req.query
	let posts
	if (pageNumber) {
		posts = await Post.find()
			.skip((pageNumber - 1) * POST_PER_PAGE)
			.limit(POST_PER_PAGE)
			.sort({ createdAt: -1 })
			.populate("user", "-password")
			.populate("comments")
			.populate("likes", "-password")
	} else if (category) {
		posts = await Post.find({ category })
			.sort({ createdAt: -1 })
			.populate("user", "-password")
			.populate("comments")
			.populate("likes", "-password")
	} else {
		posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate("user", "-password")
			.populate("comments")
			.populate("likes", "-password")
	}

	res.status(200).json(posts)
})

/** ----------------------------------------------------------------
 * @desc Get Single Post
 * @route /api/posts/:id
 * @method GET
 * @access public
   -----------------------------------------------------------------
 */

module.exports.getSinglePostController = asyncHandler(async (req, res) => {
	const post = await Post.findById(req.params.id)
		.populate("user", "-password")
		.populate({
			path: "comments",
			populate: {
				path: "user",
				select: "-password",
			},
		})
		.populate("likes", "_id username profilePhoto")

	if (!post) {
		return res.status(404).json({ message: "post not found" })
	}
	res.status(200).json(post)
})

/** ----------------------------------------------------------------
 * @desc Get Posts Count
 * @route /api/posts/count
 * @method GET
 * @access public
   -----------------------------------------------------------------
 */

module.exports.getPostCountController = asyncHandler(async (req, res) => {
	const count = await Post.count()
	res.status(200).json(count)
})

/** ----------------------------------------------------------------
 * @desc Delete Post
 * @route /api/posts/:id
 * @method DELETE
 * @access private (admin or owner of the post)
   -----------------------------------------------------------------
 */

module.exports.deletePostController = asyncHandler(async (req, res) => {
	const post = await Post.findById(req.params.id)
	if (!post) {
		return res.status(404).json({ message: "post not found" })
	}
	// verify admin & owner of the post
	if (req.user.isAdmin || req.user.id == post.user.toString()) {
		await Post.findByIdAndDelete(req.params.id)
		await cloudinaryRemoveImage(post.image.publicId)
		// delete all comments that belong to the post
		await Comment.deleteMany({
			postId: post._id,
		})

		res.status(200).json({
			message: "post has been deleted successfully",
			postId: post._id,
		})
	} else {
		res.status(403).json({ message: "access denied, forbidden" })
	}
})

/** ----------------------------------------------------------------
 * @desc Update Post
 * @route /api/posts
 * @method PUT
 * @access private (only owner of the post)
   -----------------------------------------------------------------
 */
module.exports.updatePostController = asyncHandler(async (req, res) => {
	// validation
	const { error } = validateUpdatePost(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}
	// get post from the DB, and check
	const post = await Post.findById(req.params.id)
	if (!post) {
		return res.status(404).json({ message: "post not found" })
	}
	// verify only owner of the post
	if (req.user.id !== post.user.toString()) {
		return res.status(403).json({ message: "access denied, you are not allowed" })
	}
	// update post
	const { title, description, category } = req.body
	const updatedPost = await Post.findByIdAndUpdate(
		req.params.id,
		{
			$set: {
				title,
				description,
				category,
			},
		},
		{ new: true },
	)
		.populate("user", "-password")
		.populate({
			path: "comments",
			populate: {
				path: "user",
				select: "-password",
			},
		})

	// send respost to client
	res.status(200).json(updatedPost)
})
/** ----------------------------------------------------------------
 * @desc Update Post Image
 * @route /api/posts/update-image/:id
 * @method PUT
 * @access private (only owner of the post)
   -----------------------------------------------------------------
 */
module.exports.updatePostImageController = asyncHandler(async (req, res) => {
	// validation
	if (!req.file) {
		return res.status(400).json({ message: "no image provided" })
	}
	// get post from the DB, and check
	const post = await Post.findById(req.params.id)
	if (!post) {
		return res.status(404).json({ message: "post not found" })
	}
	// verify only owner of the post
	if (req.user.id !== post.user.toString()) {
		return res.status(403).json({ message: "access denied, you are not allowed" })
	}
	// Remove old image
	await cloudinaryRemoveImage(post.image.publicId)
	// Upload the new image
	const result = await cloudinaryUploadImage(req.file.buffer, req.file.mimetype)
	// Update image feild in the DB
	const updatedPost = await Post.findByIdAndUpdate(
		req.params.id,
		{
			$set: {
				image: {
					url: result.secure_url,
					publicId: result.public_id,
				},
			},
		},
		{ new: true },
	)
		.populate("user", "-password")
		.populate("comments")
		.populate({
			path: "comments",
			populate: {
				path: "user",
				select: "-password",
			},
		})
	// Send response
	res.status(200).json({
		updatedPost,
		message: "Your post image has been updated successfully",
	})
})

/** ----------------------------------------------------------------
 * @desc Toggle Like 
 * @route /api/posts/like/:id
 * @method PUT
 * @access private (only logged in user)
   -----------------------------------------------------------------
 */
module.exports.toggleLikeController = asyncHandler(async (req, res) => {
	let { id: postId } = req.params
	let post = await Post.findById(req.params.id)

	if (!post) {
		return res.status(404).json({ message: "post not found" })
	}
	// check if the user already like the post
	const loggedInUser = req.user.id
	const isAlreadyLiked = post.likes.find(user => user.toString() == loggedInUser)
	if (isAlreadyLiked) {
		post = await Post.findByIdAndUpdate(
			postId,
			{
				$pull: {
					likes: loggedInUser,
				},
			},
			{ new: true },
		).populate("likes", "username profilePhoto")
	} else {
		post = await Post.findByIdAndUpdate(
			postId,
			{
				$push: {
					likes: loggedInUser,
				},
			},
			{ new: true },
		).populate("likes", "username profilePhoto")
	}

	res.status(200).json(post)
})
