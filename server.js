const express = require("express");
const rootRouter = require("./routes/index");
const dotenv = require('dotenv')
const app = express();
const cors = require('cors')
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/", rootRouter);

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
      status: "error",
      message: error.message,
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;

const mongoose = require("mongoose");
dotenv.config();
const queryString = process.env.MONGODB_URI ||"mongodb+srv://nttquyen041220:Nttq@learn-eng-cluster.qc2hm.mongodb.net/Learning-English-Web";
//configure mongoose
mongoose.connect(queryString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected!'))
    .catch(err => console.log('MongoDB connection error:', err.message));


// mongodb+srv://nttquyen041220:Nttq@learn-eng-cluster.qc2hm.mongodb.net/Learning-English-Web //