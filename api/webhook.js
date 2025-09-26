export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const body = req.body;

  console.log("Dialogflow Request:", JSON.stringify(body, null, 2));

  // Example simple reply
  return res.status(200).json({
    fulfillmentText: "✅ Webhook is working via Vercel!"
  });
}