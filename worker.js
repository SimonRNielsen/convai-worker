import { neon } from "@neondatabase/serverless";
import { evaluationProfiles } from "./EvaluationProfiles.js";

function getEvaluationProfile(profileId) {
    const profile = evaluationProfiles[profileId];

    if (!profile || !profile.isActive) {
        return null;
    }

    return profile;
}

async function hashPassword(password, salt) {
    const encoder = new TextEncoder();

    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        passwordKey,
        256
    );

    return new Uint8Array(hash);
}


function compareHashes(hash1, hash2) {
    if (hash1.length !== hash2.length) {
        return false;
    }

    let difference = 0;

    for (let i = 0; i < hash1.length; i++) {
        difference |= hash1[i] ^ hash2[i];
    }

    return difference === 0;
}


async function getConvaiToken(env, corsHeaders) {
    try {
        const response = await fetch(env.URL, {
            method: "POST",
            headers: {
                "CONVAI-API-KEY": env.CONVAI_API_KEY,
                "Content-Type": "application/json"
            },
            body: "{}"
        });

        const data = await response.json();

        

        if (!response.ok || !data.apiAuthToken) {
            return Response.json({
                success: false,
                message: "Could not retrieve Convai token"
            }, {
                status: 502,
                headers: corsHeaders
            });
        }

        return Response.json({
            success: true,
            apiAuthToken: data.apiAuthToken,
            expirationTime: data.expirationTime
        }, {
            headers: corsHeaders
        });

    } catch (error) {
        console.error("Convai error:", error);

        return Response.json({
            success: false,
            message: "Internal server error"
        }, {
            status: 500,
            headers: corsHeaders
        });
    }
}



async function evaluateConversation(env, corsHeaders, body) {

    if (body === null || typeof body !== "object" || Array.isArray(body)) 
    {
        return Response.json({
            success: false,
            message: "Invalid request body"
        }, {
            status: 400,
            headers: corsHeaders
        });
    }

    const { session_id, character_id, evaluation_profile_id } = body;

    // Validate required fields
    if (
        typeof session_id !== "string" ||
        typeof character_id !== "string" ||
        typeof evaluation_profile_id !== "string" ||
        !session_id.trim() ||
        !character_id.trim() ||
        !evaluation_profile_id.trim()
    ) {
        return Response.json({
            success: false,
            message: "Missing or invalid evaluation data"
        }, {
            status: 400,
            headers: corsHeaders
        });
    }

    // Find evaluation profile
    const profile = getEvaluationProfile(evaluation_profile_id);

    if (!profile) {
        return Response.json({
            success: false,
            message: "Evaluation profile not found or inactive"
        }, {
            status: 404,
            headers: corsHeaders
        });
    }

    try {
        const response = await fetch(
            "https://api.convai.com/character/evaluate_conversation",
            {
                method: "POST",
                headers: {
                    "CONVAI-API-KEY": env.CONVAI_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    session_id: session_id.trim(),
                    character_id: character_id.trim(),
                    prompt: profile.prompt,
                    variables: {}
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Convai evaluation error:", response.status, data);

            return Response.json({
                success: false,
                message: "Convai evaluation failed"
            }, {
                status: 502,
                headers: corsHeaders
            });
        }

        let parsedEvaluation;

        try {
            parsedEvaluation = JSON.parse(data.evaluation);
        } catch {
            console.error("Could not parse Convai evaluation:", data.evaluation);

            return Response.json({
                success: false,
                message: "Invalid evaluation response from Convai"
            }, {
                status: 502,
                headers: corsHeaders
            });
        }

        return Response.json({
            success: true,
            evaluation_profile_id: profile.id,
            evaluation_profile_version: profile.version,
            evaluation: parsedEvaluation
        }, {
            headers: corsHeaders
        });

    } catch (error) {
        console.error("Evaluation error:", error);

        return Response.json(
        {
            success: false,
            message: "Internal server error"
        }, {
            status: 500,
            headers: corsHeaders
        });
    }
}



export default {
    async fetch(request, env) {
        const corsHeaders = 
        {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json"
        };

        if (request.method === "OPTIONS") 
        {
            return new Response(null, {
                headers: corsHeaders
            });
        }

        if (request.method !== "POST") 
        {
            return new Response("Method not allowed", {
            status: 405,
            headers: corsHeaders
            });
        }

        const path = new URL(request.url).pathname;

        // AATE VR: No login required
        if (path === "/token") 
        {
            return getConvaiToken(env, corsHeaders);
        }

       
        // AATE VR: Evaluation without login
        if (path === "/evaluate") 
        {
            let body;

            try {
                body = await request.json();
            } catch {
                return Response.json({
                    success: false,
                    message: "Invalid JSON"
                }, {
                    status: 400,
                    headers: corsHeaders
                });
            }

            return evaluateConversation(env, corsHeaders, body);
        }

        // Main project: Login required
        if (path !== "/auth/token" && path !== "/auth/evaluate") 
        {
            return Response.json({
                success: false,
                message: "Endpoint not found"
            }, {
                status: 404,
                headers: corsHeaders
            });
        }

        // Read login data from request
        let body;

        try {
            body = await request.json();
        } catch {
            return Response.json({
                success: false,
                message: "Invalid JSON"
            }, {
                status: 400,
                headers: corsHeaders
            });
        }

        // Validate request body
        if (
            body === null ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {
            return Response.json({
                success: false,
                message: "Invalid request body"
            }, {
                status: 400,
                headers: corsHeaders
            });
        }

        // Read login data
        const userId = body.userId;
        const password = body.password;

        if (
            typeof userId !== "string" ||
            typeof password !== "string" ||
            userId.trim().length === 0 ||
            password.length === 0
        ) {
            return Response.json({
                success: false,
                message: "User ID and password are required"
            }, {
                status: 400,
                headers: corsHeaders
            });
        }

        const normalizedUserId = userId.trim();

        // Connect to NeonDB and find user
        let users;

        try {
            const sql = neon(env.DB_COMPLETEURL);
        
            users = await sql`
                SELECT hashedpw, salt
                FROM users
                WHERE userid = ${normalizedUserId}
                LIMIT 1
            `;

        } catch (error) {
            console.error(
                "Database error:",
                error?.name,
                error?.message
            );

            return Response.json({
                success: false,
                message: "Database connection failed"
            }, {
                status: 500,
                headers: corsHeaders
            });
            }

        if (users.length === 0) {
            return Response.json({
                success: false,
                message: "Invalid credentials"
            }, {
                status: 401,
                headers: corsHeaders
            });
        }

        // Verify password
        let passwordIsValid;

        try {
            const storedHash = new Uint8Array(users[0].hashedpw);
            const salt = new Uint8Array(users[0].salt);

            const calculatedHash = await hashPassword(password, salt);

            passwordIsValid = compareHashes(
                calculatedHash,
                storedHash
            );

        } catch (error) {
            console.error("Password verification error:", error);

            return Response.json({
                success: false,
                message: "Authentication failed"
            }, {
                status: 500,
                headers: corsHeaders
            });
        }

       

        // Reject invalid password
        if (!passwordIsValid) {
            return Response.json({
                success: false,
                message: "Invalid credentials"
            }, {
                status: 401,
                headers: corsHeaders
            });
        }

                // Return evaluation if requested
        if (path === "/auth/evaluate") {
            return evaluateConversation(env, corsHeaders, body);
        }

        // Otherwise return Convai token
        return getConvaiToken(env, corsHeaders);
            }

            
        };