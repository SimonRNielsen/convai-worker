
const crypto = require("crypto");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("User ID: ", (userId) => {
    rl.question("Password: ", (password) => {

        const salt = crypto.randomBytes(16);

        const hash = crypto.pbkdf2Sync(
            password,
            salt,
            100000,
            32,
            "sha256"
        );

        rl.close();
    });
});
