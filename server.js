import { loadEjs } from "./loadejs.js";
import express from "express";
import * as parser from "./parser.js";
import * as ct from "./index.js";

parser.setCookies(process.env.COOKIES);

const oneCycle = async () => {
    const projects = await parser.getAllProjects();
    for(const { id } of Object.values(projects)) {
        try {
            await parser.scanOne(id);
            console.log(id);
        } catch(e) {
            console.error(`${id} returned error!`);
            console.error(e);
        }
    }
}
if(process.env.DISABLE_CYCLES) {}
else if(process.env.INIT_CYCLE) 
    (async () => {
        await oneCycle();
        process.exit(0);
    })();
else
    (async () => {
        while(true) await oneCycle();
    })();

const app = express();
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.send(loadEjs({
        url: req.query.url || "",
        res: req.query.url ? ct.calculateTime(req.query.url) : null
    }, "index.ejs"));
});

app.listen(8043);