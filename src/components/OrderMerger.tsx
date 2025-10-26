import React, { useState } from 'react';
import { Order, Client, Item } from '../types';
import { Merge, Calendar, Package, User, Check } from 'lucide-react';

interface OrderMergerProps {
  orders: Order[];
  clients: Client[];
  items: Item[];
  onMergeOrders: (orderIds: string[], newDeliveryDate: string) => void;
}

export default function OrderMerger({ orders, clients, items, onMergeOrders }: OrderMergerProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [mergeDeliveryDate, setMergeDeliveryDate] = useState('');
  const [showMergeForm, setShowMergeForm] = useState(false);

  // Group orders by client
  const ordersByClient = orders.reduce((acc, order) => {
    if (!acc[order.clientId]) {
      acc[order.clientId] = [];
    }
    acc[order.clientId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  // Filter to show only clients with multiple orders
  const clientsWithMultipleOrders = Object.entries(ordersByClient).filter(
    ([_, orders]) => orders.length > 1
  );

  const handleOrderSelect = (orderId: string, clientId: string) => {
    const newSelected = new Set(selectedOrders);
    
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      // Only allow selection of orders from the same client
      const currentClientOrders = orders.filter(o => 
        selectedOrders.has(o.id) && o.clientId !== clientId
      );
      
      if (currentClientOrders.length > 0) {
        // Clear selections from other clients
        currentClientOrders.forEach(o => newSelected.delete(o.id));
      }
      
      newSelected.add(orderId);
      setSelectedClient(clientId);
    }
    
    if (newSelected.size === 0) {
      setSelectedClient('');
    }
    
    setSelectedOrders(newSelected);
  };

  const handleMerge = () => {
    if (selectedOrders.size < 2) return;
    
    onMergeOrders(Array.from(selectedOrders), mergeDeliveryDate);
    setSelectedOrders(new Set());
    setSelectedClient('');
    setMergeDeliveryDate('');
    setShowMergeForm(false);
  };

  const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));
  const totalItems = selectedOrdersList.reduce((sum, order) => sum + order.items.length, 0);
  const totalValue = selectedOrdersList.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Merger</h2>
          <p className="text-gray-600">Combine multiple orders from the same client</p>
        </div>
        {selectedOrders.size >= 2 && (
          <button
            onClick={() => setShowMergeForm(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Merge size={20} />
            Merge Orders ({selectedOrders.size})
          </button>
        )}
      </div>

      {/* Selection Summary */}
      {selectedOrders.size > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Merge className="text-purple-600" size={20} />
            <h3 className="font-semibold text-purple-900">
              Selected Orders ({selectedOrders.size})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-purple-700 font-medium">Client:</span>
              <div className="text-purple-900">
                {clients.find(c => c.id === selectedClient)?.name || 'Unknown'}
              </div>
            </div>
            <div>
              <span className="text-purple-700 font-medium">Total Items:</span>
              <div className="text-purple-900">{totalItems}</div>
            </div>
            <div>
              <span className="text-purple-700 font-medium">Combined Value:</span>
              <div className="text-purple-900">{totalValue.toFixed(2)} Kč</div>
            </div>
          </div>
        </div>
      )}

      {/* Orders by Client */}
      <div className="space-y-8">
        {clientsWithMultipleOrders.length === 0 ? (
          <div className="text-center py-12">
            <Merge className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No mergeable orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              Clients need at least 2 orders to enable merging functionality.
            </p>
          </div>
        ) : (
          clientsWithMultipleOrders.map(([clientId, clientOrders]) => {
            const client = clients.find(c => c.id === clientId);
            return (
              <div key={clientId} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{client?.name}</h3>
                      <p className="text-sm text-gray-500">{clientOrders.length} orders available</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientOrders.map((order) => {
                      const isSelected = selectedOrders.has(order.id);
                      const canSelect = selectedClient === '' || selectedClient === clientId;
                      
                      return (
                        <div
                          key={order.id}
                          className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50' 
                              : canSelect
                                ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                          }`}
                          onClick={() => canSelect && handleOrderSelect(order.id, clientId)}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <Check className="text-white" size={12} />
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="font-medium text-gray-900">
                              Order #{order.id.slice(-8)}
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>{new Date(order.deliveryDate).toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Package size={14} />
                                <span>{order.items.length} items</span>
                              </div>
                              
                              <div className="font-semibold text-gray-900">
                                {order.total.toFixed(2)} Kč
                              </div>
                            </div>
                            
                            <div className="text-xs">
                              <span className={`px-2 py-1 rounded-full capitalize ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Merge Form Modal */}
      {showMergeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Merge Orders</h3>
              <p className="text-sm text-gray-500 mt-1">
                Combining {selectedOrders.size} orders into one
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={mergeDeliveryDate}
                    onChange={(e) => setMergeDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Merge Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Orders to merge: {selectedOrders.size}</div>
                    <div>Total items: {totalItems}</div>
                    <div>Combined value: {totalValue.toFixed(2)} Kč</div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <p>This action will:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Combine all items from selected orders</li>
                    <li>Delete the original orders</li>
                    <li>Create a new merged order</li>
                    <li>Set the status to "pending"</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => {
                    setShowMergeForm(false);
                    setMergeDeliveryDate('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMerge}
                  disabled={!mergeDeliveryDate}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
                >
                  Merge Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}