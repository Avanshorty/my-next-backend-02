import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Simple login account for this assignment
    if (username !== "admin" || password !== "1234") {
      return NextResponse.json(
        {
          message: "Invalid username or password",
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          username: username,
        },
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );

    response.cookies.set("auth_token", "admin_logged_in", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message: "Login failed",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}