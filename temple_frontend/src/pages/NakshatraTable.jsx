import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";
import "./NakshatraTable.css";

/* ✅ EXACTLY MATCHES BACKEND */
const NAKSHATRA_OPTIONS = [
  "ASWATHY","BHARANI","KARTHIKA","ROHINI","MAKAYIRAM","THIRUVATHIRA",
  "PUNARTHAM","POOYAM","AYILYAM","MAKAM","POORAM","UTHRAM",
  "ATHAM","CHITHIRA","CHOTHI","VISHAKHAM","ANIZHAM","THRIKKETTA",
  "MOOLAM","POORADAM","UTHRADAM","THIRUVONAM","AVITTAM","CHATHAYAM",
  "POORURUTTATHI","UTHRUTTATHI","REVATHI"
];

function NakshatraTable({ type = "devotees" }) {
  const { name } = useParams();
  const navigate = useNavigate();
  const nakshatraName = name ? name.toUpperCase() : "";

  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNakshatra, setSelectedNakshatra] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [fetchLoading, setFetchLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDuplicatePage = type === "duplicates";
  const isInvalidPage = type === "invalids";
  const isDevoteePage = !isDuplicatePage && !isInvalidPage;

  // ================= FETCH =================
  const fetchData = async () => {
    setFetchLoading(true);
    try {
      let endpoint = "";
      if (isDuplicatePage) endpoint = "duplicates/";
      else if (isInvalidPage) endpoint = "invalids/";
      else endpoint = `devotees/?nakshatra=${nakshatraName}`;

      const response = await API.get(endpoint);
      setData(response.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nakshatraName, type]);

  // ================= FILTER =================
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.name?.toUpperCase().includes(searchTerm.toUpperCase()) ||
      item.phone?.includes(searchTerm);

    const matchesNak =
      !selectedNakshatra || item.nakshatra === selectedNakshatra;

    return matchesSearch && matchesNak;
  });

  // ================= EDIT =================
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      name: item.name || "",
      country_code: item.country_code || "",
      phone: item.phone || "",
      nakshatra: item.nakshatra || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // ================= UPDATE =================
  const handleUpdate = async (id) => {
    try {
      await API.put(`devotees/${id}/`, {
        ...editData,
        name: editData.name.toUpperCase(),
        nakshatra: nakshatraName,
      });

      cancelEdit();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.duplicate || "Update failed");
    }
  };

  // ================= CONVERT INVALID =================
  const handleConvert = async (id) => {
    if (
      !editData.name ||
      !editData.country_code ||
      !editData.phone ||
      !editData.nakshatra
    ) {
      alert("All fields are required");
      return;
    }

    try {
      await API.post("devotees/", {
        name: editData.name.toUpperCase(),
        country_code: editData.country_code,
        phone: editData.phone,
        nakshatra: editData.nakshatra.toUpperCase(),
      });

      await API.delete(`invalids/${id}/`);

      cancelEdit();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.duplicate || "Conversion failed");
    }
  };

  // ================= DELETE SINGLE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      const endpoint = isDuplicatePage
        ? `duplicates/${id}/`
        : isInvalidPage
        ? `invalids/${id}/`
        : `devotees/${id}/`;

      await API.delete(endpoint);
      fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  // ================= DELETE ALL (FULLY FIXED) =================
  const handleDeleteAll = async () => {
    if (data.length === 0) {
      alert("No records to delete.");
      setShowConfirmPopup(false);
      return;
    }

    try {
      setLoading(true);

      let endpoint = "";

      if (isDuplicatePage) {
        endpoint = "delete-all-duplicates/";
      } 
      else if (isInvalidPage) {
        endpoint = "delete-all-invalids/";
      } 
      else {
        endpoint = `delete-nakshatra/${nakshatraName}/`;
      }

      const response = await API.delete(endpoint);

      if (response?.data?.message) {
        alert(response.data.message);
      }

      await fetchData();
      setShowConfirmPopup(false);

    } catch (error) {
      console.error("Delete All Error:", error);
      alert(
        error.response?.data?.message ||
        "Nothing to delete or something went wrong."
      );
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
        ? [i + 1, item.name, item.country_code, item.phone, item.nakshatra, item.reason || "-"]
        : isDuplicatePage
        ? [i + 1, item.name, item.country_code, item.phone, item.nakshatra,
           new Date(item.created_at).toLocaleString()]
        : [i + 1, item.name, item.country_code, item.phone,
           new Date(item.created_at).toLocaleString()]
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

      {/* Rest of your table JSX remains SAME as before */}

      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>Are you sure?</h3>
            <button onClick={() => setShowConfirmPopup(false)}>
              Cancel
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NakshatraTable;