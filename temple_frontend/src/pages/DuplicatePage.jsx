import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./NakshatraTable.css";

function DuplicatePage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      const res = await API.get("duplicates/");
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= EDIT =================
  const startEdit = (row) => {
    setEditingId(row.id);
    setEditData(row);
  };

  const saveEdit = async () => {
    try {
      await API.post("devotees/", {
        ...editData,
        name: editData.name.toUpperCase(),
        nakshatra: editData.nakshatra.toUpperCase(),
      });

      await API.delete(`duplicates/${editingId}/`);

      navigate(`/nakshatras/${editData.nakshatra.toUpperCase()}`);
    } catch (err) {
      alert("Failed to convert duplicate");
      console.error(err.response?.data || err.message);
    }
  };

  // ================= DELETE =================
  const deleteRow = async (id) => {
    if (!window.confirm("Delete this duplicate entry?")) return;

    try {
      await API.delete(`duplicates/${id}/`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="table-container">
      <h2>DUPLICATE ENTRIES</h2>

      <button onClick={() => navigate("/nakshatras")}>
        ← Back to Nakshatras
      </button>

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

              <td>{row.country_code}</td>

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
                  <button onClick={saveEdit}>Convert</button>
                ) : (
                  <>
                    <button onClick={() => startEdit(row)}>Edit</button>
                    <button
                      style={{ marginLeft: "10px", background: "red" }}
                      onClick={() => deleteRow(row.id)}
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
    </div>
  );
}

export default DuplicatePage;
