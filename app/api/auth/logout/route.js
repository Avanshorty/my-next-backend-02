import { NextResponse } from "next/server";
import { getCorsHeaders } from "../../../../lib/cors";

const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST() {
  const response = NextResponse.json(
    {
      message: "Logout successful",
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );

    response.cookies.set("auth_token", "", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}