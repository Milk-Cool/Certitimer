import { JSDOM } from "jsdom";
import * as ct from "./index.js";

let cookies = "";

export const setCookies = newCookies => {
    cookies = newCookies;
};

/** @typedef {{ id: number }} Project */ // Not the full definition
/** @typedef {Record<string, Project>} Projects */

/**
 * @returns {Promise<Projects>} The projects
 */
export const getAllProjects = async () => {
    const f = await fetch(`https://somps.vercel.app/api/projects`);
    return await f.json();
};

/**
 * Scans one project.
 * @param {number} id Project ID
 */
export const scanOne = async id => {
    const f1 = await fetch(`https://summer.hackclub.com/projects/${id}`, {
        redirect: "manual",
        headers: {
            cookie: cookies
        }
    });
    const { window } = new JSDOM(await f1.text());
    const devlogsAndShips = Array.from(window.document.querySelector("#devlogs").children).reverse();
    for(const devlogOrShip of devlogsAndShips) {
        const shipText = devlogOrShip.querySelector(".grow-1 > div > p:nth-child(1)");
        if(!shipText || !shipText.textContent || !shipText.textContent.includes("Ship")) continue;
        const time = devlogOrShip.querySelector(".grow-1 > div > div > div > p:nth-child(1)").textContent;
        const timestamp = ct.getTimestamp(time);
        if(timestamp === -1) continue;
        ct.addShip(id, timestamp);
    }
};

let countCache = -1;
let countCacheTimestamp = -1;

/**
 * Gets certified project count.
 */
export const getCount = async () => {
    if(countCache !== -1 && Date.now() - countCacheTimestamp < 15 * 60 * 1000) // 15m cache
        return countCache;
    console.log("a");
    const f = await fetch(`https://summer.hackclub.com/votes/locked`, {
        headers: {
            cookie: cookies
        }
    });
    const { window } = new JSDOM(await f.text());
    const count = parseInt(window.document.querySelector(".card-content").textContent.match(/(?<=\()\d+/)?.[0]);
    countCache = count;
    countCacheTimestamp = Date.now();
    return count;
};