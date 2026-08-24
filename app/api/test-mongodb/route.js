import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;

    await client.db("admin").command({ ping: 1 });

    return Response.json({
      message: "MongoDB connected successfully",
    });
  } catch (error) {
    return Response.json(
      {
        message: "MongoDB connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}