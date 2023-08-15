const multer = require("multer")

const storage = multer.memoryStorage()

const photoUpload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		if (file.mimetype.startsWith("image")) {
			cb(null, true)
		} else {
			cb({ message: "unsupported file format" }, false)
		}
	},
	limits: {
		fileSize: 1024 * 1024 * 5, // Limit to 5MB
	},
})

module.exports = photoUpload
