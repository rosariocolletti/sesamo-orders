import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Item } from '../types';
import { Plus, Minus, TrendingUp } from 'lucide-react';
import { calculateDiscount } from '../utils/discountCalculator';

interface ClientOrderFormProps {
  clientId: string;
  items: Item[];
  onSubmit: (data: ClientOrderFormData) => void;
  onCancel: () => void;
  initialData?: ClientOrderFormData;
}

export interface ClientOrderFormData {
  deliveryDate: string;
  notes: string;
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
}

export default function ClientOrderForm({
  clientId,
  items,
  onSubmit,
  onCancel,
  initialData
}: ClientOrderFormProps) {
  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<ClientOrderFormData>({
    defaultValues: initialData || {
      deliveryDate: '',
      notes: '',
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const calculateSubtotal = (orderItems: Array<{ itemId: string; quantity: number }>) => {
    return orderItems.reduce((total, orderItem) => {
      const item = items.find(i => i.id === orderItem.itemId);
      return total + (item ? item.price * Number(orderItem.quantity) : 0);
    }, 0);
  };

  const subtotal = calculateSubtotal(watchedItems || []);
  const discountInfo = calculateDiscount(subtotal);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
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
            className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
          >
            <Plus size={16} />
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
                      {item.name} - {item.price.toFixed(2)} Kč
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
          <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Subtotal:</span>
                <span className="text-lg font-semibold text-gray-900">{discountInfo.subtotal.toFixed(2)} Kč</span>
              </div>

              {discountInfo.discount > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-green-700">Discount ({discountInfo.discountPercentage}%):</span>
                    <span className="text-lg font-semibold text-green-700">-{discountInfo.discount.toFixed(2)} Kč</span>
                  </div>
                  <div className="border-t border-orange-300 pt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total after discount:</span>
                    <span className="text-xl font-bold text-orange-600">{discountInfo.finalTotal.toFixed(2)} Kč</span>
                  </div>
                </>
              )}

              {discountInfo.subtotal < 1200 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-300">
                  <TrendingUp className="text-orange-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-orange-800 font-medium">{discountInfo.message}</p>
                </div>
              )}

              {discountInfo.subtotal >= 1200 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-300">
                  <div className="w-full text-center">
                    <p className="text-sm text-green-700 font-bold">{discountInfo.message}</p>
                  </div>
                </div>
              )}
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
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
        >
          Create Order
        </button>
      </div>
    </form>
  );
}
