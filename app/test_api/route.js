export async function GET() {
  return Response.json(
    { message: "Hello API" },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}