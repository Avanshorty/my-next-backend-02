import clientPromise from "./mongodb";

export async function writeAuditLog({
  username,
  userId,
  action,
  itemId = null,
  details = "",
}) {
  try {
    const client = await clientPromise;
    const db = client.db("nextjs_database");

    await db.collection("audit_logs").insertOne({
      username,
      userId,
      action,
      itemId,
      details,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}