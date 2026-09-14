import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET - Admin can view users
export async function GET(request) {
  try {
    const authUser = getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    if (authUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin access required" },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    const client = await clientPromise;
    const db = client.db("nextjs_database");

    const users = await db
      .collection("users")
      .find({})
      .project({
        password: 0,
      })
      .toArray();

    return NextResponse.json(
      {
        message: "Users retrieved successfully",
        data: users,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to retrieve users",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// POST - Admin creates a new user
export async function POST(request) {
  try {
    const authUser = getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    if (authUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin access required" },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const client = await clientPromise;
    const db = client.db("nextjs_database");
    const users = db.collection("users");

    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.insertOne({
      username,
      password: hashedPassword,
      role: role === "ADMIN" ? "ADMIN" : "USER",
      mustChangePassword: true,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "User created successfully",
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create user",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}