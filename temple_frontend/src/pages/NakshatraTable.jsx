import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";
import "./NakshatraTable.css";

const NAKSHATRA_OPTIONS = [
  "ASWATHY","BHARANI","KARTHIKA","ROHINI","MAKAYIRAM","THIRUVATHIRA",
  "PUNARTHAM","POOYAM","AYILYAM","MAKAM","POORAM","UTHRAM",
  "ATHAM","CHITHIRA","CHOTHI","VISHAKHAM","ANIZHAM","THRIKKETTA",
  "MOOLAM","POORADAM","UTHRADAM","THIRUVONAM","AVITTAM","CHATHAYAM",
  "POORURUTTATHI","UTHRUTTATHI","REVATHI"
];

function NakshatraTable({ type = "devotees" }) {

  const { name } = useParams();
  const nakshatraName = name ? name.toUpperCase() : "";

  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNakshatra, setSelectedNakshatra] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [fetchLoading, setFetchLoading] = useState(false);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // 🔥 NEW STATE FOR DOWNLOAD POPUP
  const [downloadType, setDownloadType] = useState(null);

  const isDuplicatePage = type === "duplicates";
  const isInvalidPage = type === "invalids";
  const isDevoteePage = !isDuplicatePage && !isInvalidPage;

  const fetchData = async () => {
    setFetchLoading(true);
    try {
      let endpoint = "";
      if (isDuplicatePage) endpoint = "duplicates/";
      else if (isInvalidPage) endpoint = "invalids/";
      else endpoint = `devotees/?nakshatra=${nakshatraName}`;

      const response = await API.get(endpoint);
      setData(response.data);
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [nakshatraName, type]);

  const filteredData = useMemo(() => {

    let filtered = data.filter((item) => {
      const matchSearch =
        item.name?.toUpperCase().includes(searchTerm.toUpperCase()) ||
        item.phone?.includes(searchTerm);

      const matchNak =
        !selectedNakshatra || item.nakshatra === selectedNakshatra;

      return matchSearch && matchNak;
    });

    filtered.sort((a, b) => {

      if (sortField === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      if (sortField === "date" && a.created_at && b.created_at) {
        return sortOrder === "asc"
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at);
      }

      return 0;

    });

    return filtered;

  }, [data, searchTerm, selectedNakshatra, sortField, sortOrder]);

  /* ============================
     DOWNLOAD PDF
  ============================ */

  const downloadPDF = () => {

    const doc = new jsPDF();

    const rows = filteredData.map((item, i) => [
      i + 1,
      item.name,
      item.country_code,
      item.phone,
      item.nakshatra || "",
    ]);

    autoTable(doc, {
      head: [["No", "Name", "Country Code", "Phone", "Nakshatra"]],
      body: rows,
    });

    const today = new Date().toISOString().split("T")[0];

    let fileName = "";

    if (isDuplicatePage) {
      fileName = `ALL_DUPLICATES_${today}.pdf`;
    } else if (isInvalidPage) {
      fileName = `ALL_INVALIDS_${today}.pdf`;
    } else {
      const activeNakshatra = selectedNakshatra || nakshatraName || "ALL";
      fileName = `${activeNakshatra}_${today}.pdf`;
    }

    doc.save(fileName);
    toast.success(`PDF downloaded: ${fileName}`);
  };

  /* ============================
     DOWNLOAD CSV
  ============================ */

  const downloadCSV = () => {

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const csv = XLSX.write(workbook, { bookType: "csv", type: "array" });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const today = new Date().toISOString().split("T")[0];

    let fileName = "";

    if (isDuplicatePage) {
      fileName = `ALL_DUPLICATES_${today}.csv`;
    } else if (isInvalidPage) {
      fileName = `ALL_INVALIDS_${today}.csv`;
    } else {
      const activeNakshatra = selectedNakshatra || nakshatraName || "ALL";
      fileName = `${activeNakshatra}_${today}.csv`;
    }

    saveAs(blob, fileName);
    toast.success(`CSV downloaded: ${fileName}`);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all records?")) return;

    try {
      let endpoint = "";
      if (isDuplicatePage) endpoint = "delete-all-duplicates/";
      else if (isInvalidPage) endpoint = "delete-all-invalids/";
      else endpoint = `delete-nakshatra/${nakshatraName}/`;

      await API.delete(endpoint);
      toast.success("All records deleted successfully");
      fetchData();
    } catch {
      toast.error("Delete all failed");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleUpdate = async (id) => {
    try {
      await API.put(`devotees/${id}/`, {
        ...editData,
        name: editData.name.toUpperCase(),
      });
      toast.success("Updated successfully");
      cancelEdit();
      fetchData();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleConvert = async (id) => {
    try {
      await API.post("devotees/", {
        name: editData.name.toUpperCase(),
        country_code: editData.country_code,
        phone: editData.phone,
        nakshatra: editData.nakshatra.toUpperCase(),
      });

      await API.delete(`invalids/${id}/`);
      toast.success("Converted to valid devotee");
      cancelEdit();
      fetchData();

    } catch (error) {

      const errorData = error.response?.data;
      const isDuplicate =
        errorData?.duplicate ||
        errorData?.non_field_errors ||
        errorData?.detail;

      if (isDuplicate) {
        try {
          await API.post("duplicates/", {
            name: editData.name.toUpperCase(),
            country_code: editData.country_code,
            phone: editData.phone,
            nakshatra: editData.nakshatra.toUpperCase(),
          });

          await API.delete(`invalids/${id}/`);
          toast.warning("Already exists. Moved to duplicate list.");
          cancelEdit();
          fetchData();

        } catch {
          toast.error("Failed to move to duplicate list");
        }

      } else {
        toast.error("Conversion failed");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      let endpoint = "";
      if (isDuplicatePage) endpoint = `duplicates/${id}/`;
      else if (isInvalidPage) endpoint = `invalids/${id}/`;
      else endpoint = `devotees/${id}/`;

      await API.delete(endpoint);
      toast.success("Deleted successfully");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="table-container">

      <h2>
        {isDuplicatePage
          ? "Duplicate Entries"
          : isInvalidPage
          ? "Invalid Entries"
          : `${nakshatraName} Nakshatra`}
      </h2>

      <div className="controls">

        <input
          type="text"
          placeholder="Search name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {(isDuplicatePage || isInvalidPage) && (
          <select
            value={selectedNakshatra}
            onChange={(e) => setSelectedNakshatra(e.target.value)}
          >
            <option value="">All Nakshatras</option>
            {NAKSHATRA_OPTIONS.map((nak) => (
              <option key={nak} value={nak}>{nak}</option>
            ))}
          </select>
        )}

        <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <button className="btn pdf-btn" onClick={() => setDownloadType("pdf")}>
          PDF
        </button>

        <button className="btn csv-btn" onClick={() => setDownloadType("csv")}>
          CSV
        </button>

        <button className="btn delete-btn" onClick={handleDeleteAll}>
          Delete All
        </button>
      </div>

      {/* DOWNLOAD POPUP */}
      {downloadType && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h3>Download Confirmation</h3>
            <p>
              Are you sure you want to download this{" "}
              {downloadType.toUpperCase()} file?
            </p>

            <div className="modal-actions">
              <button
                className="btn save-btn"
                onClick={() => {
                  if (downloadType === "pdf") downloadPDF();
                  if (downloadType === "csv") downloadCSV();
                  setDownloadType(null);
                }}
              >
                Confirm
              </button>

              <button
                className="btn cancel-btn"
                onClick={() => setDownloadType(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default NakshatraTable;