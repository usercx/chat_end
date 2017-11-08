const express = require("express");
const http = require("http");
const request = require("request");
const path = require("path");
const con = require("./utils/db.js");
const logger = require("./utils/logger.js");

const port = 4666;

let app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.use("/chat", require("./routes/chat.js"));
app.use("/weather", require("./routes/weather.js"));

app.use("/", function (req, res) {
	res.sendFile(__dirname + "/dist/index.html");
});

http.createServer(app).listen(port);