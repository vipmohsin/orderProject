// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).send("Method Not Allowed");
//   }

//   const body = req.body;

//   console.log("Dialogflow Request:", JSON.stringify(body, null, 2));

//   // Example simple reply
//   return res.status(200).json({
//     fulfillmentText: "✅ Webhook is working via Vercel!"
//   });
// }


// Temporary in-memory storage (per sessionId)
// ⚠️ resets whenever Vercel restarts (fine for demo, use DB later)
const sessions = {};

function getSessionId(session) {
  // Dialogflow sends: "projects/PROJECT/agent/sessions/SESSION_ID"
  return session.split("/").pop();
}

function summarizeOrders(orders) {
  if (!orders || orders.length === 0) return "Your cart is empty.";
  return orders
    .map((o, i) => {
      const toppings = o.toppings?.length ? ` with ${o.toppings.join(", ")}` : "";
      return `${i + 1}. ${o.quantity || 1} ${o.size || ""} ${o.item || "pizza"}${toppings}`;
    })
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const body = req.body;
  const intent = body.queryResult?.intent?.displayName || "";
  const params = body.queryResult?.parameters || {};
  const session = body.session || "";
  const sessionId = getSessionId(session);

  // Ensure session cart exists
  if (!sessions[sessionId]) sessions[sessionId] = { orders: [] };

  // Handle intents
  if (intent === "StartOrder") {
    return res.json({
      fulfillmentText: "Great! What would you like to order? (size, toppings, quantity)"
    });
  }

  if (intent === "CaptureOrderDetails") {
    const item = params.product || "pizza";
    const size = params.pizza_size || "regular";
    const quantity = params.number || 1;
    let toppings = params.pizza_toppings || [];
    if (typeof toppings === "string") toppings = [toppings];

    sessions[sessionId].orders.push({ item, size, toppings, quantity });

    return res.json({
      fulfillmentText: `✅ Added ${quantity} ${size} ${item}${toppings.length ? " with " + toppings.join(", ") : ""}. Would you like to add another item?`
    });
  }

  if (intent === "AddAnother - yes") {
    return res.json({
      fulfillmentText: "Sure! What would you like to add?"
    });
  }

  if (intent === "AddAnother - no" || intent === "Checkout") {
    const summary = summarizeOrders(sessions[sessionId].orders);
    return res.json({
      fulfillmentText: `Here’s your order:\n${summary}\nWould you like to confirm checkout?`
    });
  }

  if (intent === "ConfirmOrder") {
    const summary = summarizeOrders(sessions[sessionId].orders);
    // Here you could send to a real DB / order system
    sessions[sessionId].orders = []; // clear cart after checkout
    return res.json({
      fulfillmentText: `🎉 Order confirmed!\n${summary}\nThank you for ordering.`
    });
  }

  // Default fallback
  return res.json({
    fulfillmentText: "Sorry, I didn’t get that. Can you repeat?"
  });
}
