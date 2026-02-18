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

  const [bulkNakshatra, setBulkNakshatra] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

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

  // ================= SINGLE ENTRY =================

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
      await API.post("devotees/", formData);

      setSuccess("Devotee added successfully!");

      setFormData({
        name: "",
        country_code: "",
        phone: "",
        nakshatra: "",
      });

    } catch (error) {
      let message = "Error adding devotee";

      if (error.response?.data) {
        const values = Object.values(error.response.data);
        message = Array.isArray(values[0]) ? values[0][0] : values[0];
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ================= BULK UPLOAD =================

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      setError("Please select a CSV or Excel file");
      return;
    }

    if (!bulkNakshatra) {
      setError("Please select Nakshatra for bulk upload");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    const data = new FormData();
    data.append("file", selectedFile);
    data.append("nakshatra", bulkNakshatra);

    try {
      const response = await API.post("bulk-upload/", data);

      setSuccess(
        `Upload Completed Successfully!

Created: ${response.data.created}
Duplicates: ${response.data.duplicates}
Invalid Rows: ${response.data.invalid}`
      );

      setSelectedFile(null);
      setBulkNakshatra("");

    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Bulk upload failed");
      }
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

      {/* HEADER */}
      <div className="dashboard-header">
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

      {/* SINGLE ENTRY */}
      <div className="form-card">
        <h3>Single Upload</h3>

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
              enableSearch
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

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Enter Data"}
          </button>
        </form>
      </div>

      {/* BULK ENTRY */}
      <div className="form-card" style={{ marginTop: "30px" }}>
        <h3>Bulk Upload (Excel / CSV)</h3>

        <div className="form-group">
          <label>Select Nakshatra</label>
          <select
            value={bulkNakshatra}
            onChange={(e) => setBulkNakshatra(e.target.value)}
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

        <div className="form-group">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </div>

        <button onClick={handleBulkUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

    </div>
  );
}

export default AddDevotee;
