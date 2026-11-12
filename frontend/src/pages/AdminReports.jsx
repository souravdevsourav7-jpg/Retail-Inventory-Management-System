import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Package,
  IndianRupee,
  Layers,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PieChart,
} from "lucide-react";

function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  async function loadReportsData() {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("http://localhost:5000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(response.data);
    } catch (err) {
      console.error("ADMIN REPORTS ERROR:", err);
      setError(err.response?.data?.message || "Failed to load executive reports data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportsData();
  }, []);

  const totalSales = Number(data?.totalSales ?? data?.orderStats?.totalSales ?? 0);
  const totalOrders = Number(data?.totalOrders ?? data?.orderStats?.totalOrders ?? 0);
  const totalProducts = Number(data?.totalProducts ?? data?.productStats?.totalProducts ?? 0);
  const totalStock = Number(data?.totalStock ?? data?.productStats?.totalStock ?? 0);
  const lowStock = Number(data?.lowStock ?? data?.productStats?.lowStock ?? 0);
  const outOfStock = Number(data?.outOfStock ?? data?.productStats?.outOfStock ?? 0);
  const inStock = Math.max(0, totalProducts - lowStock - outOfStock);

  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  function handlePrintReport() {
    window.print();
  }

  return (
    <div className="admin-reports-page">
      {/* HEADER */}
      <div className="reports-top-bar">
        <div>
          <h2>Business Intelligence & Sales Reports</h2>
          <p>Real-time analytics and inventory performance derived from live store transactions.</p>
        </div>

        <div className="reports-actions-group">
          <button className="btn-refresh-reports" onClick={loadReportsData}>
            <RefreshCw size={16} />
            <span>Refresh Data</span>
          </button>

          <button className="btn-print-report" onClick={handlePrintReport}>
            <Download size={16} />
            <span>Export / Print Report</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="admin-loading-card">
          <div className="spinner"></div>
          <p>Compiling real-time business reports...</p>
        </div>
      )}

      {error && (
        <div className="admin-error-box">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && data && (
        <div className="reports-content-container">
          {/* TOP KPI CARDS */}
          <div className="reports-kpi-grid">
            <div className="report-kpi-card">
              <div className="kpi-icon-wrapper bg-emerald">
                <IndianRupee size={22} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-label">Gross Revenue</span>
                <strong className="kpi-val text-emerald">₹{totalSales.toLocaleString()}</strong>
                <small className="kpi-trend">From {totalOrders} completed orders</small>
              </div>
            </div>

            <div className="report-kpi-card">
              <div className="kpi-icon-wrapper bg-blue">
                <ShoppingBag size={22} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-label">Average Order Value (AOV)</span>
                <strong className="kpi-val text-blue">₹{avgOrderValue.toLocaleString()}</strong>
                <small className="kpi-trend">Per customer checkout</small>
              </div>
            </div>

            <div className="report-kpi-card">
              <div className="kpi-icon-wrapper bg-indigo">
                <Package size={22} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-label">Total Inventory Units</span>
                <strong className="kpi-val">{totalStock.toLocaleString()}</strong>
                <small className="kpi-trend">Across {totalProducts} catalog products</small>
              </div>
            </div>

            <div className="report-kpi-card">
              <div className="kpi-icon-wrapper bg-amber">
                <AlertTriangle size={22} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-label">Stock Attention Required</span>
                <strong className="kpi-val text-amber">{lowStock + outOfStock} Items</strong>
                <small className="kpi-trend">{outOfStock} out of stock, {lowStock} low stock</small>
              </div>
            </div>
          </div>

          {/* TWO COLUMN REPORTS ROW */}
          <div className="reports-two-col-row">
            {/* SALES TIMELINE */}
            <div className="report-card-panel">
              <div className="panel-header">
                <div className="panel-title-with-icon">
                  <TrendingUp size={20} className="text-blue" />
                  <h3>Daily Sales History (Real Orders)</h3>
                </div>
                <span className="panel-meta-tag">Last 14 Days Activity</span>
              </div>

              {(!data.salesTimeline || data.salesTimeline.length === 0) ? (
                <div className="report-empty-placeholder">
                  <p>No sales recorded in the past 14 days.</p>
                </div>
              ) : (
                <div className="sales-timeline-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Orders Placed</th>
                        <th className="text-right">Daily Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salesTimeline.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.date}</strong></td>
                          <td>
                            <span className="badge-count-pill">{item.orderCount} orders</span>
                          </td>
                          <td className="text-right text-emerald font-bold">
                            ₹{Number(item.revenue || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* INVENTORY HEALTH BREAKDOWN */}
            <div className="report-card-panel">
              <div className="panel-header">
                <div className="panel-title-with-icon">
                  <PieChart size={20} className="text-indigo" />
                  <h3>Catalog & Stock Health</h3>
                </div>
                <span className="panel-meta-tag">{totalProducts} Total SKUs</span>
              </div>

              <div className="stock-health-bars">
                <div className="health-bar-row">
                  <div className="health-bar-header">
                    <span className="label text-emerald">Healthy In-Stock</span>
                    <strong>{inStock} Products</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill bg-emerald"
                      style={{
                        width: `${totalProducts > 0 ? (inStock / totalProducts) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="health-bar-row">
                  <div className="health-bar-header">
                    <span className="label text-amber">Low Stock Warning (≤ 10 units)</span>
                    <strong>{lowStock} Products</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill bg-amber"
                      style={{
                        width: `${totalProducts > 0 ? (lowStock / totalProducts) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="health-bar-row">
                  <div className="health-bar-header">
                    <span className="label text-red">Out of Stock (0 units)</span>
                    <strong>{outOfStock} Products</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill bg-red"
                      style={{
                        width: `${totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="report-quick-stat-box">
                <div className="quick-stat">
                  <span>Product Categories</span>
                  <strong>{data?.totalCategories ?? data?.categoryStats?.totalCategories ?? 0}</strong>
                </div>
                <div className="quick-stat">
                  <span>Registered Customers</span>
                  <strong>{data?.totalUsers ?? data?.userStats?.totalUsers ?? 0}</strong>
                </div>
                <div className="quick-stat">
                  <span>Delivered Orders</span>
                  <strong className="text-emerald">{data?.deliveredOrders ?? data?.orderStats?.deliveredOrders ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TOP PRODUCTS REPORT TABLE */}
          {data.topSellingProducts && data.topSellingProducts.length > 0 && (
            <div className="report-card-panel full-width-panel">
              <div className="panel-header">
                <div className="panel-title-with-icon">
                  <BarChart3 size={20} className="text-emerald" />
                  <h3>Top Performing Products (By Sales Volume)</h3>
                </div>
                <span className="panel-meta-tag">Verified Database Metrics</span>
              </div>

              <div className="table-responsive-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Unit Price</th>
                      <th>Units Sold</th>
                      <th className="text-right">Total Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSellingProducts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                        </td>
                        <td>
                          <span className="badge-cat-tag">{p.category || "General"}</span>
                        </td>
                        <td>₹{Number(p.price || 0).toLocaleString()}</td>
                        <td>
                          <span className="badge-count-pill font-bold">{p.total_sold} units</span>
                        </td>
                        <td className="text-right text-emerald font-bold">
                          ₹{Number(p.total_revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminReports;
