const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
var bcrypt = require("bcrypt");
const signToken = require("./signtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;
const saltRounds = 10;

mongoose.connect(process.env.MONGO_URL);

app.use(bodyParser.json());
app.use(cors());

const User = mongoose.model("User", {name: String, email: String, hash: String});

app.post("/register", async (req, res) => {
	const {email, name, password} = req.body;

	if (email && name && password) {
		const users = await User.find({email: email});

		if (users.length > 0) {
			res.status(400).send("User with this email adress already exists.");
		} else {
			let userhash = await bcrypt.hash(password, saltRounds);

			const newUser = new User({email, name, hash: userhash});
			await newUser.save();
			signToken(newUser, req, res)
		}
	} else {
		res.status(400).send("Invalid request");
	}
});

app.get("/test", (req, res) => {
	res.status(200).send();
});

app.listen(port, () => {
	console.log("Server started on port: " + port);
});
