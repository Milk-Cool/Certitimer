import { loadEjs } from "./loadejs.js";
import express from "express";
import * as parser from "./parser.js";

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
if(process.env.INIT_CYCLE)
    oneCycle();
else
    (async () => {
        while(true) await oneCycle();
    })();

const app = express();
app.get("/", (req, res) => {
    res.send(loadEjs({}, "index.ejs"));
});

app.listen(8043);