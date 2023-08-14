const nodemailer = require("nodemailer")

module.exports = async (userEmail, subject, htmlTemplate) => {
	try {
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.APP_EMAIL_ADDRESS,
				pass: process.env.APP_EMAIL_PASSWORD,
			},
		})

		const info = await transporter.sendMail({
			from: process.env.APP_EMAIL_ADDRESS,
			to: userEmail,
			subject,
			html: htmlTemplate,
		})

		console.log("Email Sent: " + info.response)
	} catch (error) {
		console.log(error)
		throw new Error("Internal Server Error(nodemailer)")
	}
}
