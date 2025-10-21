import React, { useState } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { RoleBasedAccess } from './components/RoleBasedAccess';
import ClientDashboard from './components/ClientDashboard';
import { TabType, Client } from './types';
import { useSupabaseData } from './hooks/useSupabaseData';
import { sendOrderSMS } from './services/smsService';
import ClientManager from './components/ClientManager';
import ItemManager from './components/ItemManager';
import OrderManager from './components/OrderManager';
import OrderMerger from './components/OrderMerger';
import ReportManager from './components/ReportManager';
import { Users, Package, ShoppingCart, Merge, BarChart3 } from 'lucide-react';

function App() {
  const {
    clients,
    items,
    orders,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    addItem,
    updateItem,
    deleteItem,
    addOrder: addOrderToDb,
    updateOrder,
    deleteOrder,
    mergeOrders
  } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  // Enhanced order operations with SMS
  const addOrder = async (orderData: Omit<import('./types').Order, 'id' | 'createdAt'>) => {
    try {
      const newOrder = await addOrderToDb(orderData);

      // Send SMS notification
      try {
        const client = clients.find(c => c.id === orderData.clientId);
        if (client) {
          const smsData = {
            orderId: newOrder.id.slice(-8),
            clientName: client.name,
            total: orderData.total,
            itemCount: orderData.items.length,
            deliveryDate: orderData.deliveryDate
          };
          
          const smsSent = await sendOrderSMS(smsData);
          if (smsSent) {
            console.log('Order SMS notification sent successfully');
          } else {
            console.warn('Failed to send order SMS notification');
          }
        }
      } catch (error) {
        console.error('Error sending order SMS notification:', error);
      }
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  // Wrapper functions to add confirmation dialogs
  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client? This will also delete all related orders.')) {
      try {
        await deleteClient(id);
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item? It will be removed from all orders.')) {
      try {
        await deleteItem(id);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const handleMergeOrders = async (orderIds: string[], newDeliveryDate: string) => {
    try {
      await mergeOrders(orderIds, newDeliveryDate);
    } catch (error) {
      console.error('Error merging orders:', error);
      alert('Failed to merge orders. Please try again.');
    }
  };

  const tabs = [
    { id: 'orders' as TabType, label: 'ORD', icon: ShoppingCart, count: orders.length },
    { id: 'clients' as TabType, label: 'CLI', icon: Users, count: clients.length },
    { id: 'items' as TabType, label: 'CAT', icon: Package, count: items.length },
    { id: 'merge' as TabType, label: 'X', icon: Merge, count: 0 },
    { id: 'reports' as TabType, label: 'RPT', icon: BarChart3, count: 0 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data from Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Database Connection Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Please check your Supabase configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <RoleBasedAccess
        clientView={(clientData: Client) => (
          <ClientDashboard clientData={clientData} />
        )}
      >
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-8">
            <div className="flex space-x-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'orders' && (
            <OrderManager
              orders={orders}
              clients={clients}
              items={items}
              onAddOrder={addOrder}
              onUpdateOrder={updateOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === 'clients' && (
            <ClientManager
              clients={clients}
              onAddClient={addClient}
              onUpdateClient={updateClient}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {activeTab === 'items' && (
            <ItemManager
              items={items}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onDeleteItem={handleDeleteItem}
            />
          )}

          {activeTab === 'merge' && (
            <OrderMerger
              orders={orders}
              clients={clients}
              items={items}
              onMergeOrders={handleMergeOrders}
            />
          )}

          {activeTab === 'reports' && (
            <ReportManager
              orders={orders}
              clients={clients}
              items={items}
            />
          )}
        </main>
      </RoleBasedAccess>
    </AuthWrapper>
  );
}

export default App;