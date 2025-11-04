import React, { useState, useMemo } from 'react';
import { Order, Client, Item, ProductReport, ClientReport } from '../types';
import { BarChart3, TrendingUp, Calendar, Filter, Users, Package } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ReportManagerProps {
  orders: Order[];
  clients: Client[];
  items: Item[];
}

type PeriodType = 'daily' | 'weekly' | 'monthly';
type ReportType = 'products' | 'clients';

export default function ReportManager({ orders, clients, items }: ReportManagerProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [reportType, setReportType] = useState<ReportType>('products');

  // Helper function to get the start of the week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Helper function to format period key
  const getPeriodKey = (date: Date, periodType: PeriodType): string => {
    switch (periodType) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = getWeekStart(date);
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.deliveryDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return order.status != 'merge' && orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  // Generate product reports
  const productReports = useMemo((): ProductReport[] => {
    const productMap = new Map<string, ProductReport>();

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.deliveryDate);
      const periodKey = getPeriodKey(orderDate, period);

      order.items.forEach(orderItem => {
        const item = items.find(i => i.id === orderItem.itemId);
        if (!item) return;

        if (!productMap.has(item.id)) {
          productMap.set(item.id, {
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            totalRevenue: 0,
            totalQuantity: 0,
            orderCount: 0,
            data: []
          });
        }

        const report = productMap.get(item.id)!;
        const revenue = orderItem.price * orderItem.quantity;
        
        report.totalRevenue += revenue;
        report.totalQuantity += orderItem.quantity;

        // Find or create period data
        let periodData = report.data.find(d => d.period === periodKey);
        if (!periodData) {
          periodData = { period: periodKey, value: 0, count: 0 };
          report.data.push(periodData);
        }
        
        periodData.value += revenue;
        periodData.count += orderItem.quantity;
      });
    });

    // Count unique orders per product
    filteredOrders.forEach(order => {
      const uniqueItems = new Set(order.items.map(item => item.itemId));
      uniqueItems.forEach(itemId => {
        const report = productMap.get(itemId);
        if (report) {
          report.orderCount++;
        }
      });
    });

    return Array.from(productMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders, items, period]);

  // Generate client reports
  const clientReports = useMemo((): ClientReport[] => {
    const clientMap = new Map<string, ClientReport>();

    filteredOrders.forEach(order => {
      const client = clients.find(c => c.id === order.clientId);
      if (!client) return;

      const orderDate = new Date(order.deliveryDate);
      const periodKey = getPeriodKey(orderDate, period);

      if (!clientMap.has(client.id)) {
        clientMap.set(client.id, {
          clientId: client.id,
          clientName: client.name,
          totalRevenue: 0,
          orderCount: '0',
          data: []
        });
      }

      const report = clientMap.get(client.id)!;
      report.totalRevenue += order.total;

      // Find or create period data
      let periodData = report.data.find(d => d.period === periodKey);
      if (!periodData) {
        periodData = { period: periodKey, value: 0, count: 0 };
        report.data.push(periodData);
      }
      
      periodData.value += order.total;
      periodData.count += 1;
    });

    // Count total orders per client
    clientMap.forEach((report, clientId) => {
      const clientOrders = filteredOrders.filter(order => order.clientId === clientId);
      report.orderCount = clientOrders.length.toString();
    });

    return Array.from(clientMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders, clients, period]);

  // Generate chart data
  const chartData = useMemo(() => {
    const reports = reportType === 'products' ? productReports : clientReports;
    const topReports = reports.slice(0, 5); // Show top 5 for clarity

    // Get all unique periods and sort them
    const allPeriods = new Set<string>();
    topReports.forEach(report => {
      report.data.forEach(d => allPeriods.add(d.period));
    });
    const sortedPeriods = Array.from(allPeriods).sort();

    // Format period labels
    const formatPeriodLabel = (periodKey: string): string => {
      switch (period) {
        case 'daily':
          return new Date(periodKey).toLocaleDateString();
        case 'weekly':
          const weekStart = new Date(periodKey);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
        case 'monthly':
          const [year, month] = periodKey.split('-');
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });
        default:
          return periodKey;
      }
    };

    const colors = [
      'rgb(59, 130, 246)', // blue
      'rgb(16, 185, 129)', // green
      'rgb(245, 158, 11)', // yellow
      'rgb(239, 68, 68)',  // red
      'rgb(139, 92, 246)', // purple
    ];

    return {
      labels: sortedPeriods.map(formatPeriodLabel),
      datasets: topReports.map((report, index) => ({
        label: reportType === 'products' 
          ? (report as ProductReport).itemName 
          : (report as ClientReport).clientName,
        data: sortedPeriods.map(periodKey => {
          const periodData = report.data.find(d => d.period === periodKey);
          return periodData ? periodData.value : 0;
        }),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1,
      }))
    };
  }, [productReports, clientReports, reportType, period]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${reportType === 'products' ? 'Product' : 'Client'} Revenue Trends (${period.charAt(0).toUpperCase() + period.slice(1)})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + ' Kč';
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Track performance trends and analyze business data</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-gray-600" size={20} />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (Mon-Sun)</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="products">Products</option>
              <option value="clients">Clients</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">Revenue Trends</h3>
        </div>
        
        {chartData.datasets.length > 0 ? (
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No data available for the selected period</p>
              <p className="text-sm">Try adjusting your date range or filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Summary */}
        {reportType === 'products' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="text-green-600" size={20} />
              <h3 className="font-semibold text-gray-900">Product Performance</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">Product</th>
                    <th className="text-right py-2 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-2 font-medium text-gray-700">Quantity</th>
                    <th className="text-right py-2 font-medium text-gray-700">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {productReports.slice(0, 10).map((report) => (
                    <tr key={report.itemId} className="border-b border-gray-100">
                      <td className="py-2">
                        <div>
                          <div className="font-medium text-gray-900">{report.itemName}</div>
                          <div className="text-xs text-gray-500">{report.category}</div>
                        </div>
                      </td>
                      <td className="text-right py-2 font-medium text-gray-900">
                        {report.totalRevenue.toFixed(2)} Kč
                      </td>
                      <td className="text-right py-2 text-gray-600">
                        {report.totalQuantity}
                      </td>
                      <td className="text-right py-2 text-gray-600">
                        {report.orderCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {productReports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No product data for selected period</p>
              </div>
            )}
          </div>
        )}

        {/* Client Summary */}
        {reportType === 'clients' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-900">Client Performance</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">Client</th>
                    <th className="text-right py-2 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-2 font-medium text-gray-700">Orders</th>
                    <th className="text-right py-2 font-medium text-gray-700">Avg Order</th>
                  </tr>
                </thead>
                <tbody>
                  {clientReports.slice(0, 10).map((report) => {
                    const avgOrder = parseInt(report.orderCount) > 0 
                      ? report.totalRevenue / parseInt(report.orderCount) 
                      : 0;
                    
                    return (
                      <tr key={report.clientId} className="border-b border-gray-100">
                        <td className="py-2">
                          <div className="font-medium text-gray-900">{report.clientName}</div>
                        </td>
                        <td className="text-right py-2 font-medium text-gray-900">
                          {report.totalRevenue.toFixed(2)} Kč
                        </td>
                        <td className="text-right py-2 text-gray-600">
                          {report.orderCount}
                        </td>
                        <td className="text-right py-2 text-gray-600">
                          {avgOrder.toFixed(2)} Kč
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {clientReports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No client data for selected period</p>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="text-purple-600" size={20} />
            <h3 className="font-semibold text-gray-900">Summary Statistics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-semibold text-gray-900">{filteredOrders.length}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-gray-900">
                {filteredOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)} Kč
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold text-gray-900">
                {filteredOrders.length > 0 
                  ? (filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length).toFixed(2)
                  : '0.00'
                } Kč
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Active Clients</span>
              <span className="font-semibold text-gray-900">
                {new Set(filteredOrders.map(order => order.clientId)).size}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Products Sold</span>
              <span className="font-semibold text-gray-900">
                {new Set(filteredOrders.flatMap(order => order.items.map(item => item.itemId))).size}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}