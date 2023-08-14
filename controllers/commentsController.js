const asyncHandler = require("express-async-handler")
const { Comment, validateCreateComment, validateUpdateComment } = require("../models/Comment")
const { User } = require("../models/User")

/** ----------------------------------------------------------------
 * @desc Create New Comment
 * @route /api/comments
 * @method POST
 * @access private (only logged in user)
   -----------------------------------------------------------------
 */
module.exports.createCommentController = asyncHandler(async (req, res) => {
	const { error } = validateCreateComment(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}
	const profile = await User.findById(req.user.id)
	const comment = await Comment.create({
		postId: req.body.postId,
		text: req.body.text,
		user: req.user.id,
		username: profile.username,
	})
	const populatedComment = await Comment.findById(comment._id).populate("user", "-password")
	res.status(201).json(populatedComment)
})

/** ----------------------------------------------------------------
 * @desc Get All Comments
 * @route /api/comments
 * @method GET
 * @access private (only admin)
   -----------------------------------------------------------------
 */
module.exports.getAllCommentsController = asyncHandler(async (req, res) => {
	const comments = await Comment.find().populate("user", "-password")

	res.status(200).json(comments)
})

/** ----------------------------------------------------------------
 * @desc Get Comments Count
 * @route /api/comments/count
 * @method GET
 * @access private (only admin)
   -----------------------------------------------------------------
 */
module.exports.getCommentsCountController = asyncHandler(async (req, res) => {
	const count = await Comment.find().count()

	res.status(200).json(count)
})

/** ----------------------------------------------------------------
 * @desc Delete Comment
 * @route /api/comments/:id
 * @method DELETE
 * @access private (only admin or owner of the comment)
   -----------------------------------------------------------------
 */
module.exports.deleteCommentController = asyncHandler(async (req, res) => {
	const comment = await Comment.findById(req.params.id)
	if (!comment) {
		return res.status(404).json({ message: "comment not found" })
	}
	// authorization
	if (req.user.isAdmin || req.user.id == comment.user.toString()) {
		await Comment.findByIdAndDelete(req.params.id)
		res.status(200).json({ message: "comment has been deleted", commentId: comment._id })
	} else {
		res.status(403).json({ message: "access denied, you are not allowed" })
	}
})

/** ----------------------------------------------------------------
 * @desc Update Comment
 * @route /api/comments/:id
 * @method PUT
 * @access private (owner of the comment)
   -----------------------------------------------------------------
 */
module.exports.updateCommentController = asyncHandler(async (req, res) => {
	// validation
	const { error } = validateUpdateComment(req.body)
	if (error) {
		return res.status(400).json({ message: error.details[0].message })
	}
	// get the comment
	const comment = await Comment.findById(req.params.id)
	if (!comment) {
		return res.status(404).json({ message: "comment not found" })
	}
	// authorization
	if (req.user.id !== comment.user.toString()) {
		return res
			.status(403)
			.json({ message: "access denied, only the owner of the comment can edit it." })
	} else {
		const updatedComment = await Comment.findByIdAndUpdate(
			req.params.id,
			{
				$set: {
					text: req.body.text,
				},
			},
			{ new: true },
		).populate("user", "-password")

		res.status(200).json(updatedComment)
	}
})
