import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Order, OrderItem, Client, Item } from '../types';
import { Plus, Edit2, Trash2, ShoppingCart, Calendar, User, Package, Minus, Download, Copy } from 'lucide-react';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface OrderManagerProps {
  orders: Order[];
  clients: Client[];
  items: Item[];
  onAddOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  onUpdateOrder: (id: string, order: Omit<Order, 'id' | 'createdAt'>) => void;
  onDeleteOrder: (id: string) => void;
}

interface OrderFormData {
  clientId: string;
  deliveryDate: string;
  notes: string;
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800'
};

export default function OrderManager({ orders, clients, items, onAddOrder, onUpdateOrder, onDeleteOrder }: OrderManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<OrderFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  const filteredOrders = orders.filter(order => {
    const client = clients.find(c => c.id === order.clientId);
    const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotal = (orderItems: Array<{ itemId: string; quantity: number }>) => {
    return orderItems.reduce((total, orderItem) => {
      const item = items.find(i => i.id === orderItem.itemId);
      return total + (item ? item.price * Number(orderItem.quantity) : 0);
    }, 0);
  };

  const onSubmit = (data: OrderFormData) => {
    const orderItems: OrderItem[] = data.items.map(item => {
      const itemData = items.find(i => i.id === item.itemId);
      return {
        itemId: item.itemId,
        quantity: Number(item.quantity),
        price: itemData?.price || 0
      };
    });

    const total = calculateTotal(data.items);

    const orderData = {
      clientId: data.clientId,
      items: orderItems,
      deliveryDate: data.deliveryDate,
      status: editingOrder ? editingOrder.status : ('pending' as const),
      notes: data.notes,
      total
    };

    if (editingOrder) {
      onUpdateOrder(editingOrder.id, orderData);
    } else {
      // Note: onAddOrder is now async, but we don't need to await here
      // as the SMS sending happens in the background
      onAddOrder(orderData);
    }
    closeModal();
  };

  const openModal = (order?: Order, initialDataForNewOrder?: OrderFormData) => {
    if (order) {
      setEditingOrder(order);
      reset({
        clientId: order.clientId,
        deliveryDate: order.deliveryDate.split('T')[0],
        notes: order.notes,
        items: order.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        }))
      });
    } else {
      if (initialDataForNewOrder) {
        setEditingOrder(null);
        reset(initialDataForNewOrder);
      } else {
        setEditingOrder(null);
        reset({
          clientId: '',
          deliveryDate: '',
          notes: '',
          items: []
        });
      }
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    reset();
  };

  const handleDownloadPDF = async (order: Order) => {
    const client = clients.find(c => c.id === order.clientId);
    if (!client) return;

    const orderItems = order.items.map(orderItem => {
      const item = items.find(i => i.id === orderItem.itemId);
      return {
        ...orderItem,
        name: item?.name || 'Unknown Item',
        price: orderItem.price
      };
    });

    await generateOrderPDF(order, client, orderItems);

    if (order.status === 'pending') {
      onUpdateOrder(order.id, {
        ...order,
        status: 'processing'
      });
    }
  };

  const copyOrder = (order: Order) => {
    // Prepare the order data for the form
    const orderFormData: OrderFormData = {
      clientId: order.clientId,
      deliveryDate: order.deliveryDate.split('T')[0],
      notes: order.notes,
      items: order.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      }))
    };
    
    // Open the modal for a new order with pre-filled data
    openModal(undefined, orderFormData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders by client name or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => {
          const client = clients.find(c => c.id === order.clientId);
          return (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-500">{client?.name || 'Unknown Client'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(order)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => copyOrder(order)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Make a copy"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => openModal(order)}
                    className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteOrder(order.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
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
                    {order.items.slice(0, 3).map((orderItem) => {
                      const item = items.find(i => i.id === orderItem.itemId);
                      return (
                        <div key={orderItem.itemId} className="flex justify-between text-xs">
                          <span className="truncate">{item?.name || 'Unknown Item'} × {orderItem.quantity}</span>
                          <span>{(orderItem.price * orderItem.quantity).toFixed(2)} Kč</span>
                        </div>
                      );
                    })}
                    {order.items.length > 3 && (
                      <div className="text-xs text-gray-500">+ {order.items.length - 3} more items</div>
                    )}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{order.total.toFixed(2)} Kč</span>
                    </div>
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

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter ? 'Try adjusting your filters.' : 'Get started by creating your first order.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingOrder ? 'Edit Order' : 'Create New Order'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select
                    {...register('clientId', { required: 'Client is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                  <input
                    {...register('deliveryDate', { required: 'Delivery date is required' })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {errors.deliveryDate && <p className="text-red-500 text-sm mt-1">{errors.deliveryDate.message}</p>}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">Order Items *</label>
                  <button
                    type="button"
                    onClick={() => append({ itemId: '', quantity: 1 })}
                    className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-md transition-colors"
                  >
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <select
                          {...register(`items.${index}.itemId`, { required: 'Item is required' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select an item</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} - ${item.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          {...register(`items.${index}.quantity`, { 
                            required: 'Quantity is required',
                            min: { value: 1, message: 'Min quantity is 1' }
                          })}
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {fields.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No items added yet. Click "Add Item" to get started.
                  </div>
                )}

                {watchedItems && watchedItems.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">
                      Total: {calculateTotal(watchedItems).toFixed(2)} Kč
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
                >
                  {editingOrder ? 'Update' : 'Create'} Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}