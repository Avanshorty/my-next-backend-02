import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";
import { writeAuditLog } from "../../../lib/audit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET - Authorized users only
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

    const client = await clientPromise;
    const db = client.db("nextjs_database");

    const items = await db
      .collection("items")
      .find({
        status: { $ne: "DELETED" },
      })
      .toArray();

    await writeAuditLog({
      username: authUser.username,
      userId: authUser.userId,
      action: "VIEW_ITEMS",
      details: "Viewed item list",
    });

    return NextResponse.json(
      {
        message: "Items retrieved successfully",
        data: items,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to retrieve items",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// POST - Create item
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

    const body = await request.json();

    const client = await clientPromise;
    const db = client.db("nextjs_database");
    const items = db.collection("items");

    const newItem = {
      ...body,
      status: "ACTIVE",
      createdAt: new Date(),
    };

    const result = await items.insertOne(newItem);

    await writeAuditLog({
      username: authUser.username,
      userId: authUser.userId,
      action: "CREATE_ITEM",
      itemId: result.insertedId.toString(),
      details: `Created item: ${body.name || "Unnamed item"}`,
    });

    return NextResponse.json(
      {
        message: "Item created successfully",
        data: {
          ...newItem,
          _id: result.insertedId,
        },
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create item",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// PUT - Update item
export async function PUT(request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid item ID is required" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const body = await request.json();

    const client = await clientPromise;
    const db = client.db("nextjs_database");
    const items = db.collection("items");

    const result = await items.updateOne(
      {
        _id: new ObjectId(id),
        status: { $ne: "DELETED" },
      },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Item not found" },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    await writeAuditLog({
      username: authUser.username,
      userId: authUser.userId,
      action: "UPDATE_ITEM",
      itemId: id,
      details: `Updated item: ${body.name || id}`,
    });

    return NextResponse.json(
      {
        message: "Item updated successfully",
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update item",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// DELETE - Soft delete item
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid item ID is required" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const client = await clientPromise;
    const db = client.db("nextjs_database");
    const items = db.collection("items");

    const result = await items.updateOne(
      {
        _id: new ObjectId(id),
        status: { $ne: "DELETED" },
      },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Item not found" },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    await writeAuditLog({
      username: authUser.username,
      userId: authUser.userId,
      action: "DELETE_ITEM",
      itemId: id,
      details: "Soft deleted item",
    });

    return NextResponse.json(
      {
        message: "Item deleted successfully",
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete item",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}