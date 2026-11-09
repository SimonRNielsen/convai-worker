export default {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Content-Type": "application/json"
        };

        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: corsHeaders
            });
        }

        if (request.method !== "GET") {
            return new Response("Method not allowed", {
                status: 405
            });
        }

        const auth = request.headers.get("X-GUID");

        if (auth !== env.SECRET_KEY) {
            return new Response("Unauthorized", {
                status: 401
            });
        }

        try {
            const response = await fetch(
                env.URL,
                {
                    method: "POST",
                    headers: {
                        "CONVAI-API-KEY": env.CONVAI_API_KEY,
                        "Content-Type": "application/json"
                    },
                    body: "{}"
                }
            );

            const data = await response.json();

            if (!response.ok || !data.apiAuthToken) {
                return new Response(JSON.stringify({
                    error: "Could not retrieve Convai token"
                }), {
                    status: 502,
                    headers: corsHeaders
                });
            }

            return new Response(JSON.stringify({
                apiAuthToken: data.apiAuthToken,
                expirationTime: data.expirationTime
            }), {
                headers: corsHeaders
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: "Internal server error"
            }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};