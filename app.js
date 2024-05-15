const express = require("express");
const cors = require("cors")
const morgan = require("morgan")
const errorHandler = require("./middlewares/error")
const authRouter = require('./routes/auth');
const productRoutes = require("./routes/product")
const userRoutes = require("./routes/user")
const adminRoutes = require("./routes/admin")

const app = express();

app.use(express.json());
app.use(cors("*"));
app.use(morgan("dev"));


app.get("/", (req, res) => {
    res.send("Hello, world! welcome! to Beeha");
});

app.get("/api/v1", (req, res) => {
    res.send("Hello, world! welcome! to Beeha Api");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/product", productRoutes); 
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);


app.all("*", (req, res) =>  {
    res.send(`${req.method} ${req.originalUrl} is not supported`)
});

app.use(errorHandler)

module.exports = app;
