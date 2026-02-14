import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./AddDevotee.css";
import API from "../services/api";

function AddDevotee() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    country_code: "",
    phone: "",
    nakshatra: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const nakshatras = [
    "Aswathy","Bharani","Karthika","Rohini","Makayiram","Thiruvathira",
    "Punartham","Pooyam","Ayilyam","Makam","Pooram",
    "Uthram","Atham","Chithria","Chothi","Vishakham",
    "Anizham","Thrikketta","Moolam","Pooradam",
    "Uthradam","Thiruvonam","Avittam",
    "Chathayam","Pooruruttathi",
    "Uthruttathi","Revathi"
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhoneChange = (value, country) => {
    const countryCode = "+" + country.dialCode;
    const phoneNumber = value.slice(country.dialCode.length);

    setFormData({
      ...formData,
      country_code: countryCode,
      phone: phoneNumber,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.phone) {
      setError("Please enter phone number");
      return;
    }

    setLoading(true);

    try {
      await API.post("devotees/", {
        name: formData.name,
        country_code: formData.country_code,
        phone: formData.phone,
        nakshatra: formData.nakshatra,
      });

      setSuccess("Devotee added successfully!");

      setFormData({
        name: "",
        country_code: "",
        phone: "",
        nakshatra: "",
      });

    } catch (error) {
      let message = "Error adding devotee";

      if (error.response && error.response.data) {
        const values = Object.values(error.response.data);
        message = Array.isArray(values[0]) ? values[0][0] : values[0];
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h2></h2>

        <div className="header-actions">
          <button
            onClick={() => navigate("/nakshatras")}
            className="header-btn"
          >
            Nakshatras
          </button>

          <button
            onClick={handleLogout}
            className="header-btn logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="form-card">
        <h3>Add Devotee</h3>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <PhoneInput
              country={"in"}
              enableSearch={true}
              countryCodeEditable={false}
              value={formData.country_code + formData.phone}
              onChange={handlePhoneChange}
            />
          </div>

          <div className="form-group">
            <label>Nakshatra</label>
            <select
              name="nakshatra"
              value={formData.nakshatra}
              onChange={handleChange}
              required
            >
              <option value="">Select Nakshatra</option>
              {nakshatras.map((n, index) => (
                <option key={index} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">{success}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Enter Data"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AddDevotee;
