import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../services/api";
import "./Nakshatras.css";

function Nakshatras() {
  const navigate = useNavigate();

  const [duplicateRows, setDuplicateRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
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

  // ================= FETCH DATA =================
  useEffect(() => {
    fetchDuplicates();
    fetchInvalids();
  }, []);

  const fetchDuplicates = async () => {
    try {
      const res = await API.get("duplicates/");
      setDuplicateRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvalids = async () => {
    try {
      const res = await API.get("invalids/");
      setInvalidRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= START EDIT =================
  const startEditing = (row) => {
    setEditingId(row.id);
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

      // Delete from duplicate/invalid table after fixing
      if (duplicateRows.find((r) => r.id === editingId)) {
        await API.delete(`duplicates/${editingId}/`);
        fetchDuplicates();
      }

      if (invalidRows.find((r) => r.id === editingId)) {
        await API.delete(`invalids/${editingId}/`);
        fetchInvalids();
      }

      navigate(`/nakshatras/${editData.nakshatra.toUpperCase()}`);

    } catch (err) {
      setError("Failed to save entry");
      console.error(err.response?.data || err.message);
    }
  };

  // ================= DELETE ROW =================
  const deleteRow = async (type, id) => {
    try {
      await API.delete(`${type}/${id}/`);

      if (type === "duplicates") fetchDuplicates();
      if (type === "invalids") fetchInvalids();

    } catch (err) {
      console.error(err);
    }
  };

  // ================= TABLE RENDER =================
  const renderTable = (rows, title, type) =>
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
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {editingId === row.id ? (
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
                  {editingId === row.id ? (
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
                  {editingId === row.id ? (
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
                  {editingId === row.id ? (
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
                  {editingId === row.id ? (
                    <button onClick={handleSave}>Save</button>
                  ) : (
                    <>
                      <button onClick={() => startEditing(row)}>Edit</button>
                      <button
                        onClick={() => deleteRow(type, row.id)}
                        style={{ marginLeft: "10px", background: "red" }}
                      >
                        Delete
                      </button>
                    </>
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

      {renderTable(duplicateRows, "Duplicate Entries", "duplicates")}
      {renderTable(invalidRows, "Invalid Entries", "invalids")}

      {duplicateRows.length === 0 && invalidRows.length === 0 && (
        <p style={{ marginTop: "20px" }}>
          No duplicate or invalid rows to display.
        </p>
      )}

    </div>
  );
}

export default Nakshatras;
