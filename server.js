import { loadEjs } from "./loadejs.js";
import express from "express";
import * as ct from "./index.js";

const app = express();
app.get("/", (req, res) => {
    res.send(loadEjs({}, "index.ejs"));
});

app.listen(8043);