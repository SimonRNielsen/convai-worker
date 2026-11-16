
const crypto = require("crypto");

const userId = "aatevr1"; //UPDATE to new userid
const password = "12345"; //UPDATE to new password

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


