import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import { getUserFromRequest } from "../../../../lib/auth";
import { getCorsHeaders } from "../../../../lib/cors";

const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  try {
    const authUser = getUserFromRequest(request);

    if (!authUser) {
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

    const client = await clientPromise;
    const db = client.db("nextjs_database");
    const users = db.collection("users");

    const user = await users.findOne({
      _id: new ObjectId(authUser.userId),
    });

    if (!user) {
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

    return NextResponse.json(
      {
        loggedIn: true,
        username: user.username,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        loggedIn: false,
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}