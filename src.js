const express = require("express");
const http = require("http");
const request = require("request");
const path = require("path");
const logger = require("./utils/logger.js");

const port = 4666;

let app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.use("/", require("./routes/chat.js"));

app.use("/", function (req, res) {
	res.sendFile(__dirname + "/dist/index.html");
});

http.createServer(app).listen(port);