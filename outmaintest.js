"use strict";
const electron = require("electron");
console.log("electron type:", typeof electron);
console.log("electron keys:", electron && typeof electron === 'object' ? Object.keys(electron).join(',') : String(electron).slice(0,100));
console.log("electron.app:", electron && electron.app);
process.exit(0);
