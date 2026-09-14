import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import { createToken } from "../../../../lib/auth";

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

    const client = await clientPromise;
    const db = client.db("nextjs_database");
    const users = db.collection("users");

    const user = await users.findOne({ username });

    if (!user) {
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

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
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

    const token = createToken(user);

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          username: user.username,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
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