import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import "./NakshatraTable.css";

function NakshatraTable() {
  const { name } = useParams();

  // 🔥 Always use uppercase nakshatra
  const nakshatraName = name.toUpperCase();

  const [devotees, setDevotees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    country_code: "",
    phone: "",
  });

  // ================= FETCH =================
  const fetchDevotees = async () => {
    try {
      const response = await API.get(
        `devotees/?nakshatra=${encodeURIComponent(nakshatraName)}`
      );
      setDevotees(response.data);
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchDevotees();
  }, [nakshatraName]);

  // ================= SEARCH FILTER =================
  const filteredDevotees = devotees.filter((devotee) =>
    devotee.name.includes(searchTerm.toUpperCase()) ||
    devotee.phone.includes(searchTerm)
  );

  // ================= DELETE SINGLE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this devotee?")) return;

    try {
      await API.delete(`devotees/${id}/`);
      fetchDevotees();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  // ================= START EDIT =================
  const startEditing = (devotee) => {
    setEditingId(devotee.id);
    setEditData({
      name: devotee.name,
      country_code: devotee.country_code,
      phone: devotee.phone,
    });
  };

  // ================= UPDATE =================
  const handleUpdate = async (id) => {
    if (!editData.name || !editData.phone) {
      alert("Name and Phone cannot be empty");
      return;
    }

    try {
      await API.put(`devotees/${id}/`, {
        ...editData,
        name: editData.name.toUpperCase(),
        nakshatra: nakshatraName,
      });

      setEditingId(null);
      fetchDevotees();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  // ================= DELETE ENTIRE NAKSHATRA =================
  const handleDeleteNakshatra = async () => {
    setLoading(true);

    try {
      await API.delete(
        `delete-nakshatra/${encodeURIComponent(nakshatraName)}/`
      );
      setShowConfirmPopup(false);
      fetchDevotees();
    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-container">

      <div className="table-header">
        <div className="title-section">
          <h2>{nakshatraName} NAKSHATRA</h2>

          <button
            className="delete-nakshatra-btn"
            onClick={() => setShowConfirmPopup(true)}
          >
            Delete Table
          </button>
        </div>
      </div>

      {/* 🔍 SEARCH INPUT */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <p className="total-count">
        Showing {filteredDevotees.length} of {devotees.length} devotees
      </p>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Country Code</th>
              <th>Phone</th>
              <th>Date & Time</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDevotees.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No devotees found
                </td>
              </tr>
            ) : (
              filteredDevotees.map((devotee, index) => (
                <tr key={devotee.id}>
                  <td>{index + 1}</td>

                  <td>
                    {editingId === devotee.id ? (
                      <input
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            name: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    ) : (
                      devotee.name
                    )}
                  </td>

                  <td>{devotee.country_code}</td>

                  <td>
                    {editingId === devotee.id ? (
                      <input
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            phone: e.target.value,
                          })
                        }
                      />
                    ) : (
                      devotee.phone
                    )}
                  </td>

                  <td>
                    {new Date(devotee.created_at).toLocaleString()}
                  </td>

                  <td className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => startEditing(devotee)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(devotee.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>Delete Entire {nakshatraName} Table?</h3>
            <p>This will remove ALL devotees from this Nakshatra.</p>

            <div className="popup-actions">
              <button
                className="popup-cancel"
                onClick={() => setShowConfirmPopup(false)}
              >
                Cancel
              </button>

              <button
                className="popup-confirm"
                onClick={handleDeleteNakshatra}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NakshatraTable;
