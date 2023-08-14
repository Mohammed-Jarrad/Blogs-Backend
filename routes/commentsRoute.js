const router = require("express").Router()
const {
	createCommentController,
	getAllCommentsController,
	deleteCommentController,
	updateCommentController,
	getCommentsCountController,
} = require("../controllers/commentsController")
const validateObjectId = require("../middlewares/validateObjectId")
const { verifyToken, verifyTokenAndAdmin } = require("../middlewares/verifyToken")

//  /api/comments/
router
	.route("/")
	.post(verifyToken, createCommentController)
	.get(verifyTokenAndAdmin, getAllCommentsController)

// /api/comments/:id
router
	.route("/:id")
	.delete(validateObjectId, verifyToken, deleteCommentController)
	.put(validateObjectId, verifyToken, updateCommentController)

// /api/comments/count
router.get("/count", verifyTokenAndAdmin, getCommentsCountController)

module.exports = router
