import React, { useState, useEffect } from 'react';
import { Client, Item, Order } from '../types';
import { supabase } from '../lib/supabase';
import { Plus, Copy, ShoppingCart, Calendar, Package, LogOut, User as UserIcon, Building2, Phone, Mail } from 'lucide-react';
import ClientOrderForm, { ClientOrderFormData } from './ClientOrderForm';
import { calculateDiscount } from '../utils/discountCalculator';

interface ClientDashboardProps {
  clientData: Client;
}

export default function ClientDashboard({ clientData }: ClientDashboardProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState<ClientOrderFormData | undefined>();

  useEffect(() => {
    loadData();
  }, [clientData.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true });

      if (itemsError) throw itemsError;

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            item_id,
            quantity,
            price
          )
        `)
        .eq('client_id', clientData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const transformedItems: Item[] = itemsData?.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        weight: item.weight,
        picture_url: item.picture_url || '',
        description: item.description || '',
        createdAt: item.created_at || new Date().toISOString()
      })) || [];

      const transformedOrders: Order[] = ordersData?.map(order => ({
        id: order.id,
        clientId: order.client_id,
        items: order.order_items?.map((oi: any) => ({
          itemId: oi.item_id,
          quantity: oi.quantity,
          price: oi.price
        })) || [],
        deliveryDate: order.delivery_date,
        status: order.status as 'pending' | 'processing' | 'shipped' | 'delivered',
        notes: order.notes || '',
        total: order.total,
        createdAt: order.created_at || new Date().toISOString()
      })) || [];

      setItems(transformedItems);
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateOrder = () => {
    setInitialFormData(undefined);
    setIsModalOpen(true);
  };

  const handleDuplicateLastOrder = async () => {
    try {
      const { data: clientRecord, error } = await supabase
        .from('clients')
        .select('last_order_json')
        .eq('id', clientData.id)
        .single();

      if (error) throw error;

      if (clientRecord?.last_order_json) {
        const lastOrder = clientRecord.last_order_json as ClientOrderFormData;
        setInitialFormData({
          deliveryDate: '',
          notes: lastOrder.notes || '',
          items: lastOrder.items
        });
        setIsModalOpen(true);
      } else {
        alert('No previous order found. Please create a new order.');
      }
    } catch (err) {
      console.error('Error loading last order:', err);
      alert('Failed to load last order. Please try again.');
    }
  };

  const handleSubmitOrder = async (formData: ClientOrderFormData) => {
    try {
      const orderId = crypto.randomUUID();

      const orderItems = formData.items.map(item => {
        const itemData = items.find(i => i.id === item.itemId);
        return {
          itemId: item.itemId,
          quantity: Number(item.quantity),
          price: itemData?.price || 0
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountInfo = calculateDiscount(subtotal);

      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          client_id: clientData.id,
          delivery_date: formData.deliveryDate,
          status: 'pending',
          notes: formData.notes || null,
          total: discountInfo.finalTotal
        }]);

      if (orderError) throw orderError;

      if (orderItems.length > 0) {
        const orderItemsToInsert = orderItems.map(item => ({
          order_id: orderId,
          item_id: item.itemId,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;
      }

      await supabase
        .from('clients')
        .update({ last_order_json: formData })
        .eq('id', clientData.id);

      setIsModalOpen(false);
      setInitialFormData(undefined);
      loadData();
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Failed to create order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Sesamo - Client Portal</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="text-orange-600" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{clientData.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-gray-400" />
                  <span>VAT: {clientData.vat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <span>{clientData.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <span>{clientData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-gray-400" />
                  <span>{clientData.address}</span>
                </div>
              </div>
              {clientData.notes && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {clientData.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCreateOrder}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Plus size={20} />
              Create New Order
            </button>
            <button
              onClick={handleDuplicateLastOrder}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Copy size={20} />
              Duplicate Last Order
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Pending Orders</h3>
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first order to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.map((order) => {
                const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const discountInfo = calculateDiscount(subtotal);

                return (
                  <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="text-orange-600" size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                            <p className="text-sm text-gray-500">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Package size={16} />
                        <span>{order.items.length} item(s)</span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="space-y-1">
                          {order.items.map((orderItem) => {
                            const item = items.find(i => i.id === orderItem.itemId);
                            return (
                              <div key={orderItem.itemId} className="flex justify-between text-xs">
                                <span className="truncate">{item?.name || 'Unknown Item'} × {orderItem.quantity}</span>
                                <span>{(orderItem.price * orderItem.quantity).toFixed(2)} Kč</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="border-t pt-2 mt-2 space-y-1">
                          {discountInfo.discount > 0 ? (
                            <>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Subtotal:</span>
                                <span>{discountInfo.subtotal.toFixed(2)} Kč</span>
                              </div>
                              <div className="flex justify-between text-xs text-green-600">
                                <span>Discount ({discountInfo.discountPercentage}%):</span>
                                <span>-{discountInfo.discount.toFixed(2)} Kč</span>
                              </div>
                              <div className="flex justify-between font-semibold text-orange-600">
                                <span>Total:</span>
                                <span>{discountInfo.finalTotal.toFixed(2)} Kč</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>{order.total.toFixed(2)} Kč</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {order.notes && (
                        <div className="text-gray-600 text-xs">
                          <span className="font-medium">Notes:</span> {order.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {initialFormData ? 'Duplicate Order' : 'Create New Order'}
              </h3>
            </div>
            <div className="p-6">
              <ClientOrderForm
                clientId={clientData.id}
                items={items}
                onSubmit={handleSubmitOrder}
                onCancel={() => {
                  setIsModalOpen(false);
                  setInitialFormData(undefined);
                }}
                initialData={initialFormData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
