const router = require("express").Router()
const {
	registerUserController,
	loginUserController,
	verifyUserAccountController,
} = require("../controllers/authController")

//  /api/auth/register
router.post("/register", registerUserController)

//  /api/auth/login
router.post("/login", loginUserController)

// /api/auth/verify/:token
router.get("/verify/:token", verifyUserAccountController)

module.exports = router
