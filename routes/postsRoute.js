const router = require("express").Router()
const validateObjectId = require("../middlewares/validateObjectId")

const {
	createPostController,
	getAllPostsController,
	getSinglePostController,
	getPostCountController,
	deletePostController,
	updatePostController,
	updatePostImageController,
	toggleLikeController,
} = require("../controllers/postsController")
const photoUpload = require("../middlewares/photoUpload")
const { verifyToken } = require("../middlewares/verifyToken")

//  /api/posts
router
	.route("/")
	.post(verifyToken, photoUpload.single("image"), createPostController)
	.get(getAllPostsController)

//  /api/posts/count
router.route("/count").get(getPostCountController)

// /api/posts/update-image/:id
router
	.route("/update-image/:id")
	.put(validateObjectId, verifyToken, photoUpload.single("image"), updatePostImageController)

//  /api/posts/:id
router
	.route("/:id")
	.get(validateObjectId, getSinglePostController)
	.delete(validateObjectId, verifyToken, deletePostController)
	.put(validateObjectId, verifyToken, updatePostController)

// /api/posts/like/:id
router.route("/like/:id").put(validateObjectId, verifyToken, toggleLikeController)

module.exports = router
