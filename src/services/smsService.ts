interface OrderSMSData {
  orderId: string;
  clientName: string;
  total: number;
  itemCount: number;
  deliveryDate: string;
}

export const sendOrderSMS = async (orderData: OrderSMSData): Promise<boolean> => {
  try {
    // In a real implementation, you would get this from your Supabase project URL
    // For now, we'll use a placeholder - you'll need to replace this with your actual Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const apiUrl = `${supabaseUrl}/functions/v1/send-order-sms`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SMS service error:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('SMS sent successfully:', result);
    return true;

  } catch (error) {
    console.error('Error calling SMS service:', error);
    return false;
  }
};