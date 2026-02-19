import { useState, useEffect } from "react";
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

  // ================= AUTO HIDE SUCCESS =================
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ================= INPUT HANDLING =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "name" ? value.toUpperCase() : value,
    }));
  };

  const handlePhoneChange = (value, country) => {
    const dialCode = country?.dialCode || "";
    const phoneNumber = dialCode
      ? value.slice(dialCode.length)
      : value;

    setFormData((prev) => ({
      ...prev,
      country_code: dialCode,
      phone: phoneNumber,
    }));
  };

  // ================= SINGLE ENTRY SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.phone || !formData.nakshatra) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("devotees/", {
        ...formData,
        name: formData.name.toUpperCase(),
        nakshatra: formData.nakshatra.toUpperCase(),  // 🔥 FIXED
      });

      setSuccess(response.data.message || "Devotee added successfully!");

      setFormData({
        name: "",
        country_code: "",
        phone: "",
        nakshatra: "",
      });

    } catch (error) {
      let message = "Error adding devotee";

      if (error.response?.data) {
        const data = error.response.data;

        if (data.duplicate) message = data.duplicate;
        else if (data.error) message = data.error;
        else {
          const firstKey = Object.keys(data)[0];
          message = Array.isArray(data[firstKey])
            ? data[firstKey][0]
            : data[firstKey];
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ================= BULK UPLOAD =================

  const handleBulkUpload = async () => {
    setError("");
    setSuccess("");

    if (!selectedFile) {
      setError("Please select a CSV or Excel file");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("file", selectedFile);

    try {
      const response = await API.post("bulk-upload/", data);

      setSuccess(
        `Upload Completed Successfully!
Created: ${response.data.created}
Duplicates: ${response.data.duplicates}
Invalid Rows: ${response.data.invalid}`
      );

      setSelectedFile(null);

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

  // ================= LOGOUT =================

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <div className="dashboard-container">

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
        <h3>Single Entry</h3>

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
              value={(formData.country_code || "") + (formData.phone || "")}
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
                <option key={index} value={n.toUpperCase()}>
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
