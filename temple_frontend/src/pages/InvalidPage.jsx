import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./NakshatraTable.css";

function InvalidPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchData = async () => {
    try {
      const res = await API.get("invalids/");
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      await API.delete(`invalids/${editingId}/`);

      navigate(`/nakshatras/${editData.nakshatra.toUpperCase()}`);
    } catch (err) {
      alert("Failed to convert invalid entry");
      console.error(err.response?.data || err.message);
    }
  };

  const deleteRow = async (id) => {
    if (!window.confirm("Delete this invalid entry?")) return;

    try {
      await API.delete(`invalids/${id}/`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="table-container">
      <h2>INVALID ENTRIES</h2>

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
            <th>Reason</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.country_code}</td>
              <td>{row.phone}</td>
              <td>{row.nakshatra}</td>
              <td>{row.reason}</td>
              <td>
                <button onClick={() => startEdit(row)}>Edit & Convert</button>
                <button
                  style={{ marginLeft: "10px", background: "red" }}
                  onClick={() => deleteRow(row.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvalidPage;
