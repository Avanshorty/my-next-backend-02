import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token");

  if (authToken?.value === "admin_logged_in") {
    return NextResponse.json(
      {
        loggedIn: true,
        username: "admin",
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  }

  return NextResponse.json(
    {
      loggedIn: false,
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}