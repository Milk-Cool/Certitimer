// Taken from another one of my projects
import { join } from "path";
import { readFileSync } from "fs";
import ejs from "ejs";

const ejsPath = (...paths) => join(import.meta.dirname, "templates", ...paths);
export const loadEjs = (data, ...paths) => {
    const filepath = ejsPath(...paths);
    return ejs.render(readFileSync(filepath, "utf-8"), data, {
        "filename": filepath
    });
};