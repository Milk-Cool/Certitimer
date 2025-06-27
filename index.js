import Database from "better-sqlite3";
import "dotenv/config";
import { getCount } from "./parser.js";

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

/**
 * Approval rate.
 * Here's exactly how a calculated it:
 * 1. I scanned all projects and saved those that were shipped.
 * 2. I counted how many projects were shipped more than 5 days ago.
 * ~  5 days is roughly how long certifying a project takes, according to my estimations.
 * 3. I divided the count of approved projects (121 at the moment) by the total count of projects shipped >5 days ago.
 * Result: 121/361
 */
export const approvalRate = 0.335180055;

export const calculateTime = async url => {
    if(typeof url !== "number")
        url = url.match(/(?<=projects\/)\d+/)?.[0];
    if(!url) return -1;
    // TODO: cache
    const count = await getCount();
    if(Number.isNaN(count)) return -1;
    // I could do it in one single query, but multiple is cleaner and not much more resources-hungry
    const firstTimestamp = db.prepare(`SELECT timestamp FROM ships ORDER BY timestamp LIMIT 1`).get().timestamp;
    const firstUnratedTimestamp = db.prepare(`SELECT timestamp FROM ships ORDER BY timestamp LIMIT 1 OFFSET round(? * ?)`).get(count, approvalRate).timestamp;
    const avgTimeToRate = (firstUnratedTimestamp - firstTimestamp) / (count * approvalRate);
    const roundedProduct = Math.round(count * approvalRate);
    // https://stackoverflow.com/a/72713051
    const posInUnranked = db.prepare(`WITH sorted AS (
        SELECT *, RANK() OVER (ORDER BY timestamp ASC) num
        FROM ships
    ) SELECT num - ? AS final_num FROM sorted WHERE project_id = ? AND num > ?`).get(roundedProduct, url, roundedProduct)?.final_num;
    if(posInUnranked === undefined || posInUnranked === null) return -1;
    return posInUnranked * avgTimeToRate;
}