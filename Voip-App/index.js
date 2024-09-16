const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const http = require("http").Server(app);
const io = require("socket.io")(http);

// To hold users' information
const socketsStatus = {};

// Configure and set Handlebars for Express
const customHandlebars = handlebars.create({ layoutsDir: "./views" });
app.engine("handlebars", customHandlebars.engine);
app.set("view engine", "handlebars");

// Enable user access to public folder
app.use("/files", express.static("public"));

// Render the main interface
app.get("/home", (req, res) => {
    res.render("index");
});

// Start the server
http.listen(5000, () => {
    console.log("The app is running on port 3000!");
});
