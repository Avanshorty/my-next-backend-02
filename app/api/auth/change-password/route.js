import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import { getUserFromRequest } from "../../../../lib/auth";

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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const client = await clientPromise;
    const db = client.db("nextjs_database");
    const users = db.collection("users");

    const user = await users.findOne({
      _id: new ObjectId(authUser.userId),
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    const passwordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        message: "Password changed successfully",
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Password change failed",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}