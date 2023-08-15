const express = require("express")
const connectionToDB = require("./config/connectToDB")
const { notFound, errorHandler } = require("./middlewares/error")
const cors = require("cors")
const xss = require("xss-clean")
const rateLimiting = require("express-rate-limit")
const helmet = require("helmet")
const hpp = require("hpp")

require("dotenv").config({
	path: process.env.NODE_ENV.trim() == "production" ? ".env.production" : ".env.development",
})

// connection to DB
connectionToDB()

// init app
const app = express()

// Middlewares
app.use(express.json())

app.use(
	cors({
		origin: process.env.CLIENT_DOMAIN,
		optionsSuccessStatus: 200,
	}),
)

// add some security headers to the response (helmt)
app.use(helmet())

// prevent http params pollution
app.use(hpp())

// Prevent XSS(Cross Site Scripting) Attacks
app.use(xss())

// Rate Limiting
app.use(
	rateLimiting({
		windowMs: 10 * 60 * 1000, // 10 min
		max: 200,
	}), // it allow the user to send 200 request every 10 miniute
)

// For Deployment
app.get("/", async (req, res) => {
	res.send({ msg: "Hello in Blog Backend" })
})

// Routes
app.use("/api/auth", require("./routes/authRoute"))
app.use("/api/users", require("./routes/usersRoute"))
app.use("/api/posts", require("./routes/postsRoute"))
app.use("/api/comments", require("./routes/commentsRoute"))
app.use("/api/categories", require("./routes/categoriesRoute"))
app.use("/api/password", require("./routes/passwordRoute"))

// notfound handler
app.use(notFound)
// error handler
app.use(errorHandler)

// Running the server

const PORT = process.env.PORT
app.listen(PORT, () => {
	console.log(`server is running on ${process.env.NODE_ENV.trim()} mode in port ${PORT}`)
})
