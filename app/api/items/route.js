import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET - display only items that are NOT deleted
export async function GET() {
  try {
    const client = await clientPromise;

    const database = client.db("nextjs_database");
    const collection = database.collection("items");

    const items = await collection
      .find({ status: { $ne: "DELETED" } })
      .toArray();

    return Response.json(
      {
        message: "Items retrieved successfully",
        data: items,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return Response.json(
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

// POST - create a new item
export async function POST(request) {
  try {
    const client = await clientPromise;
    const requestData = await request.json();

    const database = client.db("nextjs_database");
    const collection = database.collection("items");

    const newItem = {
      ...requestData,
      status: "ACTIVE",
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newItem);

    return Response.json(
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
    return Response.json(
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

// DELETE - soft delete the item
export async function DELETE(request) {
  try {
    const client = await clientPromise;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        {
          message: "Item ID is required",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const database = client.db("nextjs_database");
    const collection = database.collection("items");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        {
          message: "Item not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    return Response.json(
      {
        message: "Item deleted successfully",
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return Response.json(
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