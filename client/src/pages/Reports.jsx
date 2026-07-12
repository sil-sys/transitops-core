import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [costs, setCosts] = useState({
    fuelCost: 0,
    maintenanceCost: 0,
    totalOperationalCost: 0,
    fuelEfficiency: 0,
    fleetUtilization: 0,
    totalRevenue: 0,
    vehicleROI: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const res = await api.get('/reports/cost');
        setCosts(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load cost report');
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
  }, []);

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Revenue', `$${costs.totalRevenue}`]);
    csvRows.push(['Fuel Cost', `$${costs.fuelCost}`]);
    csvRows.push(['Maintenance Cost', `$${costs.maintenanceCost}`]);
    csvRows.push(['Total Operational Cost', `$${costs.totalOperationalCost}`]);
    csvRows.push(['Fuel Efficiency', `${costs.fuelEfficiency} km/L`]);
    csvRows.push(['Fleet Utilization', `${costs.fleetUtilization}%`]);
    csvRows.push(['Vehicle ROI', `${costs.vehicleROI}%`]);

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Financial Report - ${today}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 28px;
              margin: 0 0 5px 0;
              color: #0f172a;
            }
            .header p {
              font-size: 14px;
              color: #64748b;
              margin: 0;
            }
            .date {
              font-size: 12px;
              color: #94a3b8;
              text-align: right;
              margin-top: -20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              text-align: left;
              padding: 12px 16px;
              background-color: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              color: #475569;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            td {
              padding: 16px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
            }
            .metric {
              font-weight: 600;
              color: #334155;
            }
            .value {
              font-weight: 700;
              color: #0f172a;
              text-align: right;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TransitOps Financial Report</h1>
            <p>Aggregate fleet and operational costs overview</p>
          </div>
          <div class="date">Generated on: ${today}</div>
          
          <table>
            <thead>
              <tr>
                <th>Operational Metric</th>
                <th style="text-align: right;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="metric">Total Revenue</td>
                <td class="value">$${costs.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="metric">Fuel Cost</td>
                <td class="value">$${costs.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="metric">Maintenance Cost</td>
                <td class="value">$${costs.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="metric">Total Operational Cost</td>
                <td class="value">$${costs.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="metric">Fuel Efficiency</td>
                <td class="value">${costs.fuelEfficiency} km/L</td>
              </tr>
              <tr>
                <td class="metric">Fleet Utilization</td>
                <td class="value">${costs.fleetUtilization}%</td>
              </tr>
              <tr>
                <td class="metric">Vehicle ROI</td>
                <td class="value">${costs.vehicleROI}%</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            TransitOps Fleet Management System &copy; ${new Date().getFullYear()}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Financial Reports</h1>
          <p className="text-sm text-slate-500">Aggregate operational costs overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50 border border-slate-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Revenue Widget */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block mb-2">Total Revenue</span>
            <span className="text-4xl font-extrabold text-indigo-800">
              {loading ? '...' : `$${costs.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-200/50">
            <p className="text-xs text-indigo-700/70">Completed trip revenue</p>
          </div>
        </div>

        {/* Fuel Cost Widget */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-2">Total Fuel Cost</span>
            <span className="text-4xl font-extrabold text-amber-800">
              {loading ? '...' : `$${costs.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200/50">
            <p className="text-xs text-amber-700/70">Aggregated from all fuel logs</p>
          </div>
        </div>

        {/* Maintenance Cost Widget */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block mb-2">Total Maintenance Cost</span>
            <span className="text-4xl font-extrabold text-rose-800">
              {loading ? '...' : `$${costs.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-rose-200/50">
            <p className="text-xs text-rose-700/70">Aggregated from all maintenance logs</p>
          </div>
        </div>

        {/* Total Operational Cost Widget */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block mb-2">Total Operational Cost</span>
            <span className="text-4xl font-extrabold text-rose-800">
              {loading ? '...' : `$${costs.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-rose-200/50">
            <p className="text-xs text-rose-700/70">Fuel & Maintenance: ${costs.fuelCost} + ${costs.maintenanceCost}</p>
          </div>
        </div>

        {/* Vehicle ROI Widget */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-2">Fleet ROI</span>
            <span className="text-4xl font-extrabold text-emerald-800">
              {loading ? '...' : `${costs.vehicleROI}%`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-200/50">
            <p className="text-xs text-emerald-700/70">(Revenue - Costs) / Acquisition Cost</p>
          </div>
        </div>

        {/* Fuel Efficiency Widget */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-2">Fuel Efficiency</span>
            <span className="text-4xl font-extrabold text-amber-800">
              {loading ? '...' : `${costs.fuelEfficiency} km/L`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200/50">
            <p className="text-xs text-amber-700/70">Distance per unit of fuel</p>
          </div>
        </div>

        {/* Fleet Utilization Widget */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-2">Fleet Utilization</span>
            <span className="text-4xl font-extrabold text-blue-800">
              {loading ? '...' : `${costs.fleetUtilization}%`}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200/50">
            <p className="text-xs text-blue-700/70">Percentage of active vehicles on trip</p>
          </div>
        </div>

      </div>
    </div>
  );
}
