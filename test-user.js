const crypto = require("crypto");

const password = "TestPassword123!";
const salt = Buffer.from("d2b238d6c77a3b5636fc0f3347586e43", "hex");

const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000,
    32,
    "sha256"
);

console.log("Test password:", password);
console.log("Test salt:", salt.toString("hex"));
console.log("Test hash:", hash.toString("hex"));