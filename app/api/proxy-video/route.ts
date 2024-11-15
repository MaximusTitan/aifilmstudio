import { NextResponse } from "next/server";

// Define response type
interface ProxyResponse {
    error: string;
}

export async function GET(request: Request) {
    const url = new URL(request.url).searchParams.get("url");

    if (!url) {
        return NextResponse.json<ProxyResponse>(
            { error: "URL is required" }, 
            { status: 400 }
        );
    }

    try {
        const response = await fetch(url, {
            // Disable caching to prevent the "Failed to set Next.js data cache" error
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch: ${response.status} ${response.statusText}`
            );
        }

        // Create response headers
        const headers = new Headers();
        headers.set(
            "Content-Type",
            response.headers.get("content-type") || "video/mp4"
        );
        headers.set("Access-Control-Allow-Origin", "*");
        
        // Add cache control headers to prevent caching
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");

        // Stream the response instead of buffering it
        return new NextResponse(response.body, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json<ProxyResponse>(
            { 
                error: `Failed to fetch video: ${error instanceof Error ? error.message : String(error)}` 
            },
            { status: 500 }
        );
    }
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;