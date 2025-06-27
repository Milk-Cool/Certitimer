import Database from "better-sqlite3";
import "dotenv/config";

const db = new Database("data.db");
db.pragma("journal_mode = WAL");

/**
 * Converts time text to timestamp, counting from Date.now().
 * Example: `1 day ago` -> Date.now() - 24 * 3600 * 1000
 * @param {string} text Text from ship element
 * @returns {number} The timestamp
 */
export const getTimestamp = text => {
    text = text.replace(/^about\s*/, "");
    text = text.replace(/\s*ago$/, "");
    const [numStr, unit] = text.split(/\s+/g);
    const num = parseInt(numStr);
    if(unit.match(/^seconds?$/)) return Date.now() - num * 60 * 1000;
    else if(unit.match(/^minutes?$/)) return Date.now() - num * 60 * 1000;
    else if(unit.match(/^hours?$/)) return Date.now() - num * 3600 * 1000;
    else if(unit.match(/^days?$/)) return Date.now() - num * 24 * 3600 * 1000;
    else if(unit.match(/^months?$/)) return Date.now() - num * 30 * 24 * 3600 * 1000;
    else return -1;
};

/**
 * @typedef {object} Ship A ship
 * @prop {number} id Internal ID
 * @prop {number} project_id Project ID
 * @prop {number} timestamp Last ship timestamp
 */
db.prepare(`CREATE TABLE IF NOT EXISTS ships (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL,
    timestamp INTEGER NOT NULL
)`).run();

/**
 * Gets the ship by project ID.
 * @param {Ship["project_id"]} projectID Project ID
 * @returns {Ship} The ship
 */
export const getShipByProjectID = projectID => {
    return db.prepare(`SELECT * FROM ships WHERE project_id = ?`).get(projectID);
};
/**
 * Adds or updates a ship.
 * @param {Ship["project_id"]} projectID Project ID
 * @param {Ship["timestamp"]} timestamp Ship timestamp
 */
export const addShip = (projectID, timestamp) => {
    if(getShipByProjectID(projectID))
        db.prepare("UPDATE ships SET timestamp = ? WHERE project_id = ?").run(timestamp, projectID);
    db.prepare("INSERT INTO ships (project_id, timestamp) VALUES (?, ?)").run(projectID, timestamp);
};