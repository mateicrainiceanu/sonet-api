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
	const newSonets  = await Sonet.insertMany(sonete);
	const sonets = await Sonet.find({fromUserId: req.user.id});
	res.json({sonets: sonets, newSonets});
});

app.patch("/sonet/:id", auth, async (req, res) => {
	const sonetId = req.params.id;
	const {mesaj, forName} = req.body;
	await Sonet.updateOne({_id: sonetId}, {mesaj, forName});
	res.status(200).json({sonetId, mesaj});
});

app.get("/sonete", auth, async (req, res) => {
	const sonete = await Sonet.find({fromUserId: req.user.id});
	res.status(200).json({sonete});
});

app.get("/sonet/:id", async (req, res) => {
	const sonet = await Sonet.findById({_id: req.params.id})
		.populate("fromUserId")
		.catch(() => {
			res.status(400).send("No sonet found...");
		});
	if (sonet) res.status(200).json(sonet);
});

app.delete("/sonet/:id", async (req, res) => {
	const {deletedCount} = await Sonet.deleteOne({_id: req.params.id});
	if (deletedCount) res.status(200).send("Deleted");
	else res.status(500).send("Error deleting! Try again!");
});

app.get("/user", auth, (req, res) => {
	res.status(200).json(req.user);
});

app.listen(port, () => {
	console.log("Server started on port: " + port);
});
