
const crypto = require("crypto");
const readline = require("readline");
const { neon } = require("@neondatabase/serverless");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const sql = neon(process.env.DB_COMPLETEURL);

rl.question("User ID: ", (userId) => {
    rl.question("Password: ", async (password) => {

        try {
            // Generate salt
            const salt = crypto.randomBytes(16);

            // Generate password hash
            const hash = crypto.pbkdf2Sync(
                password,
                salt,
                100000,
                32,
                "sha256"
            );

            // Convert hash and salt to hex
            const hashHex = hash.toString("hex");
            const saltHex = salt.toString("hex");

            // Insert user into NeonDB
            await sql`
                INSERT INTO users (userid, hashedpw, salt)
                VALUES (
                    ${userId},
                    decode(${hashHex}, 'hex'),
                    decode(${saltHex}, 'hex')
                )
            `;

            console.log("\nUser created successfully!");
            console.log("User ID:", userId);
            console.log("Hash length:", hash.length);
            console.log("Salt length:", salt.length);

        } catch (error) {
            console.error("Error creating user:", error.message);

        } finally {
            rl.close();
        }
    });
});
