interface OrderData {
  orderId: string;
  clientName: string;
  total: number;
  itemCount: number;
  deliveryDate: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const toNumber = Deno.env.get('NOTIFICATION_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      throw new Error('Missing required Twilio environment variables');
    }

    // Parse the request body
    const { orderId, clientName, total, itemCount, deliveryDate }: OrderData = await req.json();

    // Format the SMS message
    const message = `🛒 NEW ORDER ALERT!
Order #${orderId}
Client: ${clientName}
Items: ${itemCount}
Total: $${total.toFixed(2)}
Delivery: ${new Date(deliveryDate).toLocaleDateString()}

OrderFlow Pro`;

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', fromNumber);
    formData.append('To', toNumber);
    formData.append('Body', message);

    // Create basic auth header
    const credentials = btoa(`${accountSid}:${authToken}`);

    // Send SMS via Twilio API
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: result.sid,
        message: 'SMS sent successfully' 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error sending SMS:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});