const jwt = require("jsonwebtoken");
require("dotenv").config();

function signToken(user, req, res) {
	const token = jwt.sign({id: user._id, email: user.email}, process.env.TOKEN_KEY);
	res.status(200).json({token});
}

module.exports = signToken;
