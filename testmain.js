"use strict";
const electron = require("electron");
console.log("FROM ROOT - electron type:", typeof electron);
if (typeof electron === 'object' && electron !== null) {
  console.log("FROM ROOT - has app:", !!electron.app);
  console.log("FROM ROOT - keys:", Object.keys(electron).slice(0,8).join(','));
} else {
  console.log("FROM ROOT - value:", String(electron).slice(0, 100));
}
process.exit(0);
