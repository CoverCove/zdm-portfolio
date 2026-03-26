exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let email, firstName, fields;
  try {
    ({ email, firstName, fields } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email) {
    return { statusCode: 422, body: JSON.stringify({ error: "Email is required" }) };
  }

  const API_KEY = "IJCPdv2qLecFQuikL7h6Hw";
  const FORM_ID = "9247267";
  const TAG_ID  = 1918923;

  try {
    /* Step 1: Subscribe to form — creates the subscriber and fires any form automations */
    const formRes = await fetch(
      `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key:    API_KEY,
          email,
          first_name: firstName || "",
          tags:       [TAG_ID],
          fields:     fields || {},
        }),
      }
    );

    const formData = await formRes.json();

    if (!formRes.ok) {
      console.error("ConvertKit form subscribe failed:", formData);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: formData.message || "ConvertKit error" }),
      };
    }

    console.log("ConvertKit subscribe success:", JSON.stringify(formData));

    /* Step 2: Apply tag directly — ensures the sequence fires even if form automations differ */
    const tagRes = await fetch(
      `https://api.convertkit.com/v3/tags/${TAG_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key:    API_KEY,
          email,
          first_name: firstName || "",
        }),
      }
    );

    const tagData = await tagRes.json();
    if (!tagRes.ok) {
      /* Non-fatal — log but still return success since form subscribe worked */
      console.warn("ConvertKit tag subscribe failed (non-fatal):", tagData);
    } else {
      console.log("ConvertKit tag applied:", JSON.stringify(tagData));
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };

  } catch (err) {
    console.error("subscribe.js unhandled error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
