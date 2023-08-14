const router = require("express").Router()
const {
	createCategoryController,
	getAllCategoriesController,
	deleteCategoryController,
} = require("../controllers/categoriesController")
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken")
const validateObjectId = require("../middlewares/validateObjectId")

// /api/categories/
router
	.route("/")
	.post(verifyTokenAndAdmin, createCategoryController)
	.get(getAllCategoriesController)

// /api/categories/:id
router.route("/:id").delete(validateObjectId, verifyTokenAndAdmin, deleteCategoryController )

module.exports = router
