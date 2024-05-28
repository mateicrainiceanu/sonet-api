const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
var bcrypt = require("bcrypt");
const signToken = require("./signtoken");
const auth = require("./auth");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;
const saltRounds = 10;

mongoose.connect(process.env.MONGO_URL);

app.use(bodyParser.json());
app.use(cors());

const userSchema = new mongoose.Schema({name: String, email: String, hash: String});

const User = mongoose.model("User", userSchema);
const Sonet = mongoose.model("Sonet", {
	fromUserId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
	forUserId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
	forName: String,
	mesaj: String,
});

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
			signToken(newUser, req, res);
		}
	} else {
		res.status(400).send("Invalid request");
	}
});

app.post("/login", async (req, res) => {
	const {email, password} = req.body;

	const user = await User.findOne({email: email});

	if (user == null) {
		res.status(400).send("No user with this email adress.");
	} else {
		const passmatch = await bcrypt.compare(password, user.hash);
		if (passmatch) signToken(user, req, res);
		else res.status(400).send("Wrong password!");
	}
});

app.post("/id-sonete", auth, async (req, res) => {
	const num = req.body.number;
	const fromUserId = req.user.id;
	const sonete = Array(num).fill({fromUserId});
	const son = await Sonet.insertMany(sonete);
	res.json({sonets: son});
});

app.patch("/sonet/:id", auth, async (req, res) => {
	const sonetId = req.params.id;
	const {mesaj, forName} = req.body;

	const {modifiedCount} = await Sonet.updateOne({_id: sonetId}, {mesaj, forName});

	if (modifiedCount) res.status(200).json({sonetId, mesaj});
	else res.status(500).send("Error saving your Sonet");
});

app.get("/sonete", auth, async (req, res) => {
	const sonete = await Sonet.find({fromUserId: req.user.id, mesaj:{$ne: null}}).populate("fromUserId");
	res.status(200).json({sonete});
});

app.get("/user", auth, (req, res) => {
	res.status(200).json(req.user);
})

app.listen(port, () => {
	console.log("Server started on port: " + port);
});
