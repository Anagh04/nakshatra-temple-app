import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";
import "./Nakshatras.css";

function Nakshatras() {
  const navigate = useNavigate();
  const location = useLocation();

  const duplicateRows = location.state?.duplicateRows || [];
  const invalidRows = location.state?.invalidRows || [];

  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState("");

  const nakshatras = [
    "ASWATHY","BHARANI","KARTHIKA","ROHINI","MAKAYIRAM","THIRUVATHIRA",
    "PUNARTHAM","POOYAM","AYILYAM","MAKAM","POORAM",
    "UTHRAM","ATHAM","CHITHRIA","CHOTHI","VISHAKHAM",
    "ANIZHAM","THRIKKETTA","MOOLAM","POORADAM",
    "UTHRADAM","THIRUVONAM","AVITTAM",
    "CHATHAYAM","POORURUTTATHI",
    "UTHRUTTATHI","REVATHI"
  ];

  // ================= START EDIT =================
  const startEditing = (row, index) => {
    setEditingIndex(index);
    setEditData({
      name: row.name,
      country_code: row.country_code,
      phone: row.phone,
      nakshatra: row.nakshatra,
    });
  };

  // ================= SAVE EDIT =================
  const handleSave = async () => {
    setError("");

    if (!editData.name || !editData.phone || !editData.nakshatra) {
      setError("All fields are required");
      return;
    }

    try {
      await API.post("devotees/", {
        ...editData,
        name: editData.name.toUpperCase(),
        nakshatra: editData.nakshatra.toUpperCase(),
      });

      // Redirect to that nakshatra table
      navigate(`/nakshatras/${editData.nakshatra.toUpperCase()}`);

    } catch (err) {
      setError("Failed to save entry");
      console.error(err.response?.data || err.message);
    }
  };

  // ================= TABLE RENDER =================
  const renderTable = (rows, title) =>
    rows.length > 0 && (
      <div className="result-card">
        <h3>{title} ({rows.length})</h3>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Country Code</th>
              <th>Phone</th>
              <th>Nakshatra</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  {editingIndex === index ? (
                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                    />
                  ) : (
                    row.name
                  )}
                </td>

                <td>
                  {editingIndex === index ? (
                    <input
                      value={editData.country_code}
                      onChange={(e) =>
                        setEditData({ ...editData, country_code: e.target.value })
                      }
                    />
                  ) : (
                    row.country_code
                  )}
                </td>

                <td>
                  {editingIndex === index ? (
                    <input
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                    />
                  ) : (
                    row.phone
                  )}
                </td>

                <td>
                  {editingIndex === index ? (
                    <input
                      value={editData.nakshatra}
                      onChange={(e) =>
                        setEditData({ ...editData, nakshatra: e.target.value })
                      }
                    />
                  ) : (
                    row.nakshatra
                  )}
                </td>

                <td>
                  {editingIndex === index ? (
                    <button onClick={handleSave}>Save</button>
                  ) : (
                    <button onClick={() => startEditing(row, index)}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {error && <div className="error-box">{error}</div>}
      </div>
    );

  return (
    <div className="nakshatra-container">

      <div className="nakshatra-header">
        <h2>Select Nakshatra</h2>
      </div>

      {/* NAKSHATRA GRID */}
      <div className="nakshatra-grid">
        {nakshatras.map((n, index) => (
          <div
            key={index}
            className="nakshatra-card"
            onClick={() => navigate(`/nakshatras/${encodeURIComponent(n)}`)}
          >
            {n}
          </div>
        ))}
      </div>

      {/* DUPLICATE TABLE */}
      {renderTable(duplicateRows, "Duplicate Entries")}

      {/* INVALID TABLE */}
      {renderTable(invalidRows, "Invalid Entries")}

      {duplicateRows.length === 0 && invalidRows.length === 0 && (
        <p style={{ marginTop: "20px" }}>
          No duplicate or invalid rows to display.
        </p>
      )}

    </div>
  );
}

export default Nakshatras;
