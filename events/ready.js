const package = require("../package.json");
const fs = require("node:fs");
const path = require("node:path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const config = require("../config.json");

module.exports = {

    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`O Salazar ${package.version} está ligado e operando.`);
    }

};