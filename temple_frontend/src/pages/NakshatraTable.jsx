import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
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
  const [fetchLoading, setFetchLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDuplicatePage = type === "duplicates";
  const isInvalidPage = type === "invalids";
  const isDevoteePage = !isDuplicatePage && !isInvalidPage;

  // ================= FETCH DATA =================
  const fetchData = async () => {
    setFetchLoading(true);
    try {
      let endpoint = "";

      if (isDuplicatePage) endpoint = "duplicates/";
      else if (isInvalidPage) endpoint = "invalids/";
      else endpoint = `devotees/?nakshatra=${nakshatraName}`;

      const response = await API.get(endpoint);

      // Safe handling if pagination ever enabled
      const responseData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setData(responseData);

    } catch (err) {
      console.error("Fetch Error:", err);
      setData([]);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nakshatraName, type]);

  // ================= FILTER =================
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.name?.toUpperCase().includes(searchTerm.toUpperCase()) ||
        item.phone?.includes(searchTerm);

      return matchesSearch;
    });
  }, [data, searchTerm]);

  // ================= DELETE SINGLE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      let endpoint = "";

      if (isDuplicatePage) endpoint = `duplicates/${id}/`;
      else if (isInvalidPage) endpoint = `invalids/${id}/`;
      else endpoint = `devotees/${id}/`;

      await API.delete(endpoint);
      fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  // ================= DELETE ALL =================
  const handleDeleteAll = async () => {
    if (data.length === 0) return;

    try {
      setLoading(true);

      let endpoint = "";

      if (isDuplicatePage) endpoint = "delete-all-duplicates/";
      else if (isInvalidPage) endpoint = "delete-all-invalids/";
      else endpoint = `delete-nakshatra/${nakshatraName}/`;

      const response = await API.delete(endpoint);

      alert(response?.data?.message || "Deleted successfully");
      fetchData();
      setShowConfirmPopup(false);

    } catch (error) {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= PDF =================
  const downloadPDF = () => {
    const doc = new jsPDF();

    const headers = isInvalidPage
      ? ["No", "Name", "Country Code", "Phone", "Nakshatra", "Reason"]
      : isDuplicatePage
      ? ["No", "Name", "Country Code", "Phone", "Nakshatra", "Date"]
      : ["No", "Name", "Country Code", "Phone", "Date"];

    const rows = filteredData.map((item, i) =>
      isInvalidPage
        ? [
            i + 1,
            item.name,
            item.country_code,
            item.phone,
            item.nakshatra,
            item.reason || "-",
          ]
        : isDuplicatePage
        ? [
            i + 1,
            item.name,
            item.country_code,
            item.phone,
            item.nakshatra,
            new Date(item.created_at).toLocaleString(),
          ]
        : [
            i + 1,
            item.name,
            item.country_code,
            item.phone,
            new Date(item.created_at).toLocaleString(),
          ]
    );

    autoTable(doc, { head: [headers], body: rows });
    doc.save("data.pdf");
  };

  // ================= CSV =================
  const downloadCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const csv = XLSX.write(workbook, { bookType: "csv", type: "array" });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    saveAs(blob, "data.csv");
  };

  return (
    <div className="table-container">

      {/* ================= HEADER ================= */}
      <div className="table-header">
        <h2>
          {isDuplicatePage
            ? `DUPLICATE ENTRIES (${data.length})`
            : isInvalidPage
            ? `INVALID ENTRIES (${data.length})`
            : `${nakshatraName} NAKSHATRA (${data.length})`}
        </h2>

        <div className="header-buttons">
          <button onClick={downloadPDF}>Download PDF</button>
          <button onClick={downloadCSV}>Download CSV</button>
          <button
            disabled={data.length === 0}
            onClick={() => setShowConfirmPopup(true)}
          >
            Delete All
          </button>
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      <input
        type="text"
        placeholder="Search by name or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {/* ================= TABLE ================= */}
      {fetchLoading ? (
        <p>Loading...</p>
      ) : filteredData.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Country Code</th>
              <th>Phone</th>
              {isDevoteePage && <th>Date</th>}
              {(isDuplicatePage || isInvalidPage) && <th>Nakshatra</th>}
              {isInvalidPage && <th>Reason</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.country_code}</td>
                <td>{item.phone}</td>

                {isDevoteePage && (
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                )}

                {(isDuplicatePage || isInvalidPage) && (
                  <td>{item.nakshatra}</td>
                )}

                {isInvalidPage && <td>{item.reason}</td>}

                <td>
                  <button onClick={() => handleDelete(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= DELETE CONFIRM ================= */}
      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>Are you sure?</h3>
            <button onClick={() => setShowConfirmPopup(false)}>
              Cancel
            </button>
            <button onClick={handleDeleteAll} disabled={loading}>
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default NakshatraTable;