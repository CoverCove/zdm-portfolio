exports.handler = async (event) => {
  const { email, firstName } = JSON.parse(event.body);

  const res = await fetch(
    `https://api.convertkit.com/v3/forms/9247267/subscribe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: "IJCPdv2qLecFQuikL7h6Hw",
        email,
        first_name: firstName,
        tags: [1918923],
      }),
    }
  );

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
