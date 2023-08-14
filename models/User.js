const mongoose = require("mongoose")
const joi = require("joi")
const jwt = require("jsonwebtoken")
const strongPass = require("joi-password-complexity")

// User Schema
const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 100,
			lowercase: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			minlength: 5,
			maxlength: 100,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
			trim: true,
		},
		profilePhoto: {
			type: Object,
			default: {
				url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
				publicId: null,
			},
		},
		bio: {
			type: String,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isAccountVerified: {
			type: Boolean,
			default: false,
		},
		verificationToken: String,
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
	},
)

// Populate Posts that belong to the user, when the user get his profile
userSchema.virtual("posts", {
	ref: "Post",
	foreignField: "user",
	localField: "_id",
})
// Populate Comments that belong to the user, when the user get his profile
userSchema.virtual("comments", {
	ref: "Comment",
	foreignField: "user",
	localField: "_id",
})

// Generate Auth token
userSchema.methods.generateAuthToken = function () {
	return jwt.sign({ id: this._id, isAdmin: this.isAdmin }, process.env.JWT_SECRET)
}

// User Model
const User = mongoose.model("User", userSchema)

// validate register User
const validateRegisterUser = obj => {
	const schema = joi.object({
		username: joi.string().trim().min(2).max(100).required(),
		email: joi.string().trim().min(5).max(100).required().email(),
		password: strongPass().required(),
	})
	return schema.validate(obj)
}
// validate Login User
const validateLoginUser = obj => {
	const schema = joi.object({
		email: joi.string().trim().min(5).max(100).required().email(),
		password: joi.string().trim().min(8).required(),
	})
	return schema.validate(obj)
}

// Validate Update User
const validateUpdateUser = obj => {
	const schema = joi.object({
		username: joi.string().trim().min(2).max(100),
		password: strongPass(),
		bio: joi.string().trim(),
	})
	return schema.validate(obj)
}

// validate Login User
const validateEmail = obj => {
	const schema = joi.object({
		email: joi.string().trim().min(5).max(100).required().email(),
	})
	return schema.validate(obj)
}

// validate Login User
const validateNewPassword = obj => {
	const schema = joi.object({
		password: strongPass().required(),
	})
	return schema.validate(obj)
}

module.exports = {
	User,
	validateRegisterUser,
	validateLoginUser,
	validateUpdateUser,
	validateEmail,
	validateNewPassword,
}
