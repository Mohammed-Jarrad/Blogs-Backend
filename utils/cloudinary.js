const cloudinary = require("cloudinary").v2

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_SECRET,
})

// cloudinary upload image
const cloudinaryUploadImage = async fileToUpload => {
	try {
		const data = await cloudinary.uploader.upload(fileToUpload, {
			resource_type: "auto",
		})
		return data
	} catch (error) {
		console.log(error)
		throw new Error("nternal Server Error (cloudinary)")
	}
}

// cloudinary remove image
const cloudinaryRemoveImage = async imagePublicId => {
	try {
		const result = await cloudinary.uploader.destroy(imagePublicId)
		return result
	} catch (error) {
		console.log(error)
		throw new Error("nternal Server Error (cloudinary)")
	}
}

// cloudinary remove multiple image
const cloudinaryRemoveMultipleImages = async publicIds => {
	try {
		const result = await cloudinary.api.delete_resources(publicIds)
		return result
	} catch (error) {
		console.log(error)
		throw new Error("nternal Server Error (cloudinary)")
	}
}

module.exports = {
	cloudinaryUploadImage,
	cloudinaryRemoveImage,
	cloudinaryRemoveMultipleImages,
}
