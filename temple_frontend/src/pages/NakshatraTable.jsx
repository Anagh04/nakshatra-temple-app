import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import API from "../services/api";
import "./NakshatraTable.css";

function NakshatraTable() {
  const { name } = useParams();
  const navigate = useNavigate();

  const [devotees, setDevotees] = useState([]);
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
      const response = await API.get(`devotees/?nakshatra=${name}`);
      setDevotees(response.data);
    } catch (error) {
      console.error("Error fetching data");
    }
  };

  useEffect(() => {
    fetchDevotees();
  }, [name]);

  // ================= DELETE SINGLE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this devotee?")) return;

    try {
      await API.delete(`devotees/${id}/`);
      fetchDevotees();
    } catch (error) {
      console.error("Error deleting");
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
    try {
      await API.put(`devotees/${id}/`, {
        ...editData,
        nakshatra: name,
      });

      setEditingId(null);
      fetchDevotees();
    } catch (error) {
      console.error("Error updating devotee");
    }
  };

  // ================= DELETE ENTIRE NAKSHATRA =================
  const handleDeleteNakshatra = async () => {
    setLoading(true);
    try {
      await API.delete(`delete-nakshatra/${name}/`);
      setShowConfirmPopup(false);
      fetchDevotees();
    } catch (error) {
      console.error("Error deleting nakshatra data");
    } finally {
      setLoading(false);
    }
  };

  // ================= PDF DOWNLOAD =================
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${name} Nakshatra Devotee List`, 14, 15);

    autoTable(doc, {
      head: [["No", "Name", "Country Code", "Phone", "Date & Time"]],
      body: devotees.map((d, i) => [
        i + 1,
        d.name,
        d.country_code,
        d.phone,
        new Date(d.created_at).toLocaleString(),
      ]),
      startY: 25,
    });

    doc.save(`${name}_Nakshatra_List.pdf`);
  };

  // ================= EXCEL DOWNLOAD =================
  const downloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Devotees");

    worksheet.columns = [
      { header: "No", key: "no", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Country Code", key: "code", width: 15 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Date & Time", key: "date", width: 25 },
    ];

    devotees.forEach((d, i) => {
      worksheet.addRow({
        no: i + 1,
        name: d.name,
        code: d.country_code,
        phone: d.phone,
        date: new Date(d.created_at).toLocaleString(),
      });
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${name}_Nakshatra_List.xlsx`);
  };

  // ================= CSV DOWNLOAD =================
  const downloadCSV = () => {
    const headers = [
      "No",
      "Name",
      "Country Code",
      "Phone",
      "Date & Time",
    ];

    const rows = devotees.map((d, i) => [
      i + 1,
      d.name,
      d.country_code,
      d.phone,
      new Date(d.created_at).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `${name}_Nakshatra_List.csv`);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <div className="title-section">
          <h2>{name} Nakshatra</h2>

          <button
            className="delete-nakshatra-btn"
            onClick={() => setShowConfirmPopup(true)}
          >
            Delete Table
          </button>
        </div>

        <div className="header-actions">
          <button onClick={() => navigate("/nakshatras")} className="header-btn">
            Back
          </button>
          <button onClick={downloadPDF} className="download-btn">
            PDF
          </button>
          <button onClick={downloadExcel} className="download-btn">
            Excel
          </button>
          <button onClick={downloadCSV} className="download-btn">
            CSV
          </button>
        </div>
      </div>

      <p className="total-count">
        Total Devotees: <strong>{devotees.length}</strong>
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
            {devotees.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No devotees found
                </td>
              </tr>
            ) : (
              devotees.map((devotee, index) => (
                <tr key={devotee.id}>
                  <td>{index + 1}</td>

                  <td>
                    {editingId === devotee.id ? (
                      <input
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                      />
                    ) : (
                      devotee.name
                    )}
                  </td>

                  <td>
                    {editingId === devotee.id ? (
                      <input
                        value={editData.country_code}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            country_code: e.target.value,
                          })
                        }
                      />
                    ) : (
                      devotee.country_code
                    )}
                  </td>

                  <td>
                    {editingId === devotee.id ? (
                      <input
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData({ ...editData, phone: e.target.value })
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
                    {editingId === devotee.id ? (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => handleUpdate(devotee.id)}
                        >
                          Save
                        </button>

                        <button
                          className="cancel-btn"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
            <h3>Delete Entire {name} Table?</h3>
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
