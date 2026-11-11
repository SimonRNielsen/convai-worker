
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
            600000,
            32,
            "sha256"
        );

        console.log("\n--- User data ---");
        console.log("id:", userId);
        console.log("hashedpw:", hash.toString("hex"));
        console.log("salt:", salt.toString("hex"));

        rl.close();
    });
});
