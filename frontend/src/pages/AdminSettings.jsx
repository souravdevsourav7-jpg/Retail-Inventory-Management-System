import { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  Shield,
  Save,
  CheckCircle2,
  Bell,
  Truck,
} from "lucide-react";

function AdminSettings() {
  const [settings, setSettings] = useState({
    storeName: "Retail Inventory",
    tagline: "Online Retail Store",
    supportEmail: "support@retailinventory.com",
    supportPhone: "+91 98765 43210",
    fulfillmentCity: "Bengaluru, Karnataka",
    currency: "₹",
    lowStockThreshold: "10",
    freeShippingEnabled: true,
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("retail_store_settings"));
      if (saved) {
        setSettings((prev) => ({ ...prev, ...saved }));
      }
    } catch {
      // ignore
    }
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSave(e) {
    e.preventDefault();
    try {
      localStorage.setItem("retail_store_settings", JSON.stringify(settings));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="admin-settings-page">
      {/* HEADER */}
      <div className="settings-top-bar">
        <div>
          <h2>Store Configuration & System Settings</h2>
          <p>Manage store profile, inventory thresholds, and customer checkout policies.</p>
        </div>

        {savedNotice && (
          <div className="settings-saved-pill">
            <CheckCircle2 size={16} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="settings-form-layout">
        {/* SECTION 1: STORE IDENTITY */}
        <div className="settings-card-panel">
          <div className="settings-card-header">
            <Store size={20} className="text-blue" />
            <div>
              <h3>Store Profile & Branding</h3>
              <p>Public store details shown across customer navbar and footer</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="settings-field">
              <label>Store Name</label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="settings-field">
              <label>Store Subtitle / Tagline</label>
              <input
                type="text"
                name="tagline"
                value={settings.tagline}
                onChange={handleChange}
              />
            </div>

            <div className="settings-field">
              <label>Support Email Address</label>
              <input
                type="email"
                name="supportEmail"
                value={settings.supportEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="settings-field">
              <label>Customer Support Hotline</label>
              <input
                type="tel"
                name="supportPhone"
                value={settings.supportPhone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="settings-field full-width">
              <label>Fulfillment Center Location</label>
              <input
                type="text"
                name="fulfillmentCity"
                value={settings.fulfillmentCity}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: INVENTORY & THRESHOLDS */}
        <div className="settings-card-panel">
          <div className="settings-card-header">
            <Bell size={20} className="text-amber" />
            <div>
              <h3>Inventory Alert Thresholds</h3>
              <p>Configure stock alert warnings and notification benchmarks</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="settings-field">
              <label>Low Stock Warning Level (Units)</label>
              <input
                type="number"
                name="lowStockThreshold"
                value={settings.lowStockThreshold}
                onChange={handleChange}
                min="1"
                max="100"
              />
              <small className="field-hint">
                Products with inventory at or below this value will trigger Low Stock badges.
              </small>
            </div>

            <div className="settings-field">
              <label>Store Currency Symbol</label>
              <input
                type="text"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                maxLength="3"
              />
              <small className="field-hint">Default is ₹ (Indian Rupee).</small>
            </div>
          </div>
        </div>

        {/* SECTION 3: CHECKOUT & SHIPPING */}
        <div className="settings-card-panel">
          <div className="settings-card-header">
            <Truck size={20} className="text-emerald" />
            <div>
              <h3>Shipping & Checkout Policy</h3>
              <p>Delivery pricing and payment checkout rules</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="settings-field full-width">
              <label className="checkbox-setting-label">
                <input
                  type="checkbox"
                  name="freeShippingEnabled"
                  checked={settings.freeShippingEnabled}
                  onChange={handleChange}
                />
                <div>
                  <strong>Enable 100% Free Express Delivery on All Orders</strong>
                  <span className="block text-muted">
                    When active, standard express shipping is offered without additional delivery charges.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-submit-bar">
          <button type="submit" className="btn-save-settings">
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;
