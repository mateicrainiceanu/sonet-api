const jwt = require("jsonwebtoken");
require("dotenv").config();

function auth(req, res, next) {
	const token = req.body.token || req.query.token;
	jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
		if (err) res.status(400).send("Auth failed");
		else {
			req.user = decoded;
			next();
		}
	});
}

module.exports = auth;
