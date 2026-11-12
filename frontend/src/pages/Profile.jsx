import { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  IndianRupee,
  MapPin,
  Edit2,
  Check,
  LogOut,
  Calendar,
  X,
  CheckCircle2,
} from "lucide-react";

function Profile({ user, onNavigate, onLogout }) {
  const [orderStats, setOrderStats] = useState({ count: 0, total: 0 });
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Address
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addressSavedNotice, setAddressSavedNotice] = useState(false);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
  });
  const [profileUpdatedNotice, setProfileUpdatedNotice] = useState(false);

  useEffect(() => {
    // Load Saved Address
    try {
      const savedAddr = JSON.parse(localStorage.getItem("retail_saved_address")) || {};
      if (savedAddr.street) {
        setAddress(savedAddr);
      }
    } catch {
      // ignore
    }

    // Load User Orders for stats
    async function fetchUserOrders() {
      try {
        setLoadingOrders(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/my-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orders = res.data || [];
        const total = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
        setOrderStats({ count: orders.length, total });
      } catch (err) {
        console.error("PROFILE ORDERS FETCH ERROR:", err);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchUserOrders();
  }, []);

  function handleSaveAddress(e) {
    e.preventDefault();
    try {
      localStorage.setItem("retail_saved_address", JSON.stringify(address));
      setAddressSavedNotice(true);
      setTimeout(() => setAddressSavedNotice(false), 3000);
    } catch {
      // ignore
    }
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem("user")) || {};
      const updatedUser = {
        ...currentUser,
        name: profileData.name,
        mobile: profileData.mobile,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileUpdatedNotice(true);
      setIsEditModalOpen(false);
      setTimeout(() => setProfileUpdatedNotice(false), 3000);
      // Reload page or sync state
      window.location.reload();
    } catch {
      // ignore
    }
  }

  return (
    <div className="user-profile-page-container">
      {/* PROFILE HEADER CARD */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-avatar-circle">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h2>{user?.name || "Customer"}</h2>
              <span className="profile-role-pill">
                <ShieldCheck size={14} />
                <span>Verified Customer</span>
              </span>
            </div>
            <p className="profile-email-text">{user?.email}</p>
            <p className="profile-mobile-text">
              <Phone size={14} /> {user?.mobile || "Not specified"}
            </p>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            className="btn-edit-profile-open"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 size={16} />
            <span>Edit Profile</span>
          </button>

          <button className="btn-profile-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {profileUpdatedNotice && (
        <div className="profile-success-toast">
          <CheckCircle2 size={18} />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* STATS STRIP */}
      <div className="profile-stats-grid">
        <div className="profile-stat-box">
          <div className="stat-icon-wrap bg-blue-subtle">
            <ShoppingBag size={22} className="text-blue" />
          </div>
          <div>
            <span className="stat-label">Total Orders Placed</span>
            <strong className="stat-value">{loadingOrders ? "..." : orderStats.count}</strong>
          </div>
        </div>

        <div className="profile-stat-box">
          <div className="stat-icon-wrap bg-emerald-subtle">
            <IndianRupee size={22} className="text-emerald" />
          </div>
          <div>
            <span className="stat-label">Total Spend</span>
            <strong className="stat-value text-emerald">
              {loadingOrders ? "..." : `₹${orderStats.total.toLocaleString()}`}
            </strong>
          </div>
        </div>

        <div
          className="profile-stat-box clickable-stat"
          onClick={() => onNavigate && onNavigate("my-orders")}
        >
          <div className="stat-icon-wrap bg-indigo-subtle">
            <Calendar size={22} className="text-indigo" />
          </div>
          <div>
            <span className="stat-label">Order History</span>
            <strong className="stat-value">View Past Orders →</strong>
          </div>
        </div>
      </div>

      {/* DELIVERY ADDRESS FORM */}
      <div className="profile-address-card">
        <div className="profile-card-header">
          <div className="title-with-icon">
            <MapPin size={20} className="text-blue" />
            <div>
              <h3>Default Delivery Address</h3>
              <p>Saved shipping destination for fast 1-click checkout</p>
            </div>
          </div>
          {addressSavedNotice && (
            <span className="badge-saved-success">
              <Check size={14} /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveAddress} className="address-form-grid">
          <div className="form-field-full">
            <label>House / Flat, Street Name, Area</label>
            <input
              type="text"
              value={address.street}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, street: e.target.value }))
              }
              placeholder="e.g. 104, Sunrise Residency, 100ft Road"
            />
          </div>

          <div className="form-fields-trio">
            <div className="form-field-item">
              <label>City</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="e.g. Bengaluru"
              />
            </div>

            <div className="form-field-item">
              <label>State</label>
              <input
                type="text"
                value={address.state}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, state: e.target.value }))
                }
                placeholder="e.g. Karnataka"
              />
            </div>

            <div className="form-field-item">
              <label>Pincode</label>
              <input
                type="text"
                value={address.pincode}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, pincode: e.target.value }))
                }
                placeholder="e.g. 560038"
              />
            </div>
          </div>

          <div className="address-form-actions">
            <button type="submit" className="btn-save-address">
              Save Default Address
            </button>
          </div>
        </form>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div
          className="modal-backdrop-overlay"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="profile-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-line">
              <h3>Edit Profile Details</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="form-group-item">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="form-group-item">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={profileData.mobile}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      mobile: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
