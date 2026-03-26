/**
 * Netlify serverless function: /netlify/functions/subscribe
 *
 * Acts as a secure proxy between the contact form and the ConvertKit v3 API.
 * The API key is stored as a Netlify environment variable (CK_API_KEY) and
 * never exposed to the browser.
 *
 * Set these in Netlify → Site settings → Environment variables:
 *   CK_API_KEY   = your ConvertKit public API key
 *   CK_FORM_ID   = 9247267
 *   CK_TAG_ID    = 1918923
 */

exports.handler = async function (event) {
  /* Only allow POST */
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  /* Parse the incoming body */
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { email, firstName, fields } = payload;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 422, body: JSON.stringify({ error: 'Valid email is required' }) };
  }

  const CK_API_KEY = process.env.CK_API_KEY;
  const CK_FORM_ID = process.env.CK_FORM_ID || '9247267';
  const CK_TAG_ID  = parseInt(process.env.CK_TAG_ID || '1918923', 10);

  if (!CK_API_KEY) {
    console.error('CK_API_KEY environment variable is not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const ckRes = await fetch(
      `https://api.convertkit.com/v3/forms/${CK_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:    CK_API_KEY,
          email,
          first_name: firstName || '',
          tags:       [CK_TAG_ID],
          fields:     fields || {}
        })
      }
    );

    const ckData = await ckRes.json();

    if (!ckRes.ok) {
      const msg = ckData?.message || `ConvertKit status ${ckRes.status}`;
      console.error('ConvertKit error:', msg, ckData);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: msg })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, subscriber: ckData.subscription?.subscriber })
    };

  } catch (err) {
    console.error('Subscribe function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
