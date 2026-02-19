import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";
import "./NakshatraTable.css";

function NakshatraTable({ type = "devotees" }) {
  const { name } = useParams();
  const nakshatraName = name ? name.toUpperCase() : "";

  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");

  const isDuplicatePage = type === "duplicates";

  // ================= FETCH =================
  const fetchData = async () => {
    setFetchLoading(true);
    setError("");

    try {
      const endpoint = isDuplicatePage
        ? "duplicates/"
        : `devotees/?nakshatra=${encodeURIComponent(nakshatraName)}`;

      const response = await API.get(endpoint);
      setData(response.data);
    } catch (err) {
      setError("Failed to fetch data.");
      console.error(err.response?.data || err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nakshatraName, type]);

  // ================= FILTER =================
  const filteredData = data.filter(
    (item) =>
      item.name?.toUpperCase().includes(searchTerm.toUpperCase()) ||
      item.phone?.includes(searchTerm)
  );

  // ================= PDF DOWNLOAD =================
  const downloadPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "No",
      "Name",
      "Country Code",
      "Phone",
      "Date & Time",
    ];

    const tableRows = filteredData.map((item, index) => [
      index + 1,
      item.name,
      item.country_code,
      item.phone,
      item.created_at
        ? new Date(item.created_at).toLocaleString()
        : "-",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
    });

    doc.save(
      isDuplicatePage
        ? "Duplicate_Entries.pdf"
        : `${nakshatraName}_nakshatra.pdf`
    );
  };

  // ================= CSV DOWNLOAD =================
  const downloadCSV = () => {
    const csvData = filteredData.map((item, index) => ({
      No: index + 1,
      Name: item.name,
      CountryCode: item.country_code,
      Phone: item.phone,
      DateTime: item.created_at
        ? new Date(item.created_at).toLocaleString()
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const csvOutput = XLSX.write(workbook, {
      bookType: "csv",
      type: "array",
    });

    const blob = new Blob([csvOutput], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(
      blob,
      isDuplicatePage
        ? "Duplicate_Entries.csv"
        : `${nakshatraName}_nakshatra.csv`
    );
  };

  // ================= DELETE SINGLE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      const endpoint = isDuplicatePage
        ? `duplicates/${id}/`
        : `devotees/${id}/`;

      await API.delete(endpoint);
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  // ================= EDIT START =================
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      country_code: item.country_code,
      phone: item.phone,
    });
  };

  // ================= UPDATE =================
  const handleUpdate = async (id) => {
    if (!editData.name || !editData.phone) {
      alert("Name and Phone cannot be empty");
      return;
    }

    try {
      const endpoint = isDuplicatePage
        ? `duplicates/${id}/`
        : `devotees/${id}/`;

      await API.put(endpoint, {
        ...editData,
        name: editData.name.toUpperCase(),
        nakshatra: nakshatraName,
      });

      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  // ================= DELETE ALL =================
  const handleDeleteAll = async () => {
    setLoading(true);

    try {
      if (isDuplicatePage) {
        for (const item of data) {
          await API.delete(`duplicates/${item.id}/`);
        }
      } else {
        await API.delete(
          `delete-nakshatra/${encodeURIComponent(nakshatraName)}/`
        );
      }

      setShowConfirmPopup(false);
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>
          {isDuplicatePage
            ? `DUPLICATE ENTRIES (${data.length})`
            : `${nakshatraName} NAKSHATRA (${data.length})`}
        </h2>

        <div className="header-buttons">
          <button className="pdf-btn" onClick={downloadPDF}>
            Download PDF
          </button>

          <button className="csv-btn" onClick={downloadCSV}>
            Download CSV
          </button>

          <button
            className="delete-nakshatra-btn"
            onClick={() => setShowConfirmPopup(true)}
          >
            {isDuplicatePage ? "Delete All Duplicates" : "Delete Table"}
          </button>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrapper">
        {fetchLoading ? (
          <div className="no-data">Loading...</div>
        ) : (
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
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No data found
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td>
                      {editingId === item.id ? (
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
                        item.name
                      )}
                    </td>

                    <td>{item.country_code}</td>

                    <td>
                      {editingId === item.id ? (
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
                        item.phone
                      )}
                    </td>

                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "-"}
                    </td>

                    <td>
                      {editingId === item.id ? (
                        <>
                          <button onClick={() => handleUpdate(item.id)}>
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(item)}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(item.id)}>
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
        )}
      </div>

      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>
              {isDuplicatePage
                ? "Delete ALL Duplicate Entries?"
                : `Delete Entire ${nakshatraName} Table?`}
            </h3>

            <div className="popup-actions">
              <button onClick={() => setShowConfirmPopup(false)}>
                Cancel
              </button>

              <button onClick={handleDeleteAll} disabled={loading}>
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
