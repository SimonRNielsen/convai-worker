
const crypto = require("crypto");

const userId = "aatevr1";
const password = "12345";

// Generate a new random salt
const salt = crypto.randomBytes(16);

// Generate PBKDF2 hash
const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000,
    32,
    "sha256"
);

console.log("User ID:", userId);
console.log("New hash:", hash.toString("hex"));
console.log("New salt:", salt.toString("hex"));
