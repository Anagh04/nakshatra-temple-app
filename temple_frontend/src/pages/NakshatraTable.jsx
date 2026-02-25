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

  // 🔥 Custom modals
  const [downloadType, setDownloadType] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllMode, setDeleteAllMode] = useState(false);

  const isDuplicatePage = type === "duplicates";
  const isInvalidPage = type === "invalids";
  const isDevoteePage = !isDuplicatePage && !isInvalidPage;

  /* ================= FETCH ================= */

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

  /* ================= FILTER + SORT ================= */

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

  /* ================= DOWNLOAD ================= */

  const generateFileName = (ext) => {
    const today = new Date().toISOString().split("T")[0];

    if (isDuplicatePage) return `ALL_DUPLICATES_${today}.${ext}`;
    if (isInvalidPage) return `ALL_INVALIDS_${today}.${ext}`;

    const activeNakshatra = selectedNakshatra || nakshatraName || "ALL";
    return `${activeNakshatra}_${today}.${ext}`;
  };

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

    const fileName = generateFileName("pdf");
    doc.save(fileName);
    toast.success(`PDF downloaded: ${fileName}`);
  };

  const downloadCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const csv = XLSX.write(workbook, { bookType: "csv", type: "array" });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const fileName = generateFileName("csv");
    saveAs(blob, fileName);
    toast.success(`CSV downloaded: ${fileName}`);
  };

  /* ================= DELETE ================= */

  const confirmDelete = async () => {
    try {
      if (deleteAllMode) {
        let endpoint = "";
        if (isDuplicatePage) endpoint = "delete-all-duplicates/";
        else if (isInvalidPage) endpoint = "delete-all-invalids/";
        else endpoint = `delete-nakshatra/${nakshatraName}/`;

        await API.delete(endpoint);
        toast.success("All records deleted successfully");
      } else if (deleteTarget) {
        let endpoint = "";
        if (isDuplicatePage) endpoint = `duplicates/${deleteTarget}/`;
        else if (isInvalidPage) endpoint = `invalids/${deleteTarget}/`;
        else endpoint = `devotees/${deleteTarget}/`;

        await API.delete(endpoint);
        toast.success("Deleted successfully");
      }

      fetchData();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
      setDeleteAllMode(false);
    }
  };

  /* ================= EDIT ================= */

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

  /* ================= CONVERT ================= */

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

  /* ================= UI ================= */

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

        <button className="btn pdf-btn" onClick={() => setDownloadType("pdf")}>PDF</button>
        <button className="btn csv-btn" onClick={() => setDownloadType("csv")}>CSV</button>
        <button className="btn delete-btn" onClick={() => setDeleteAllMode(true)}>Delete All</button>
      </div>

      {/* DOWNLOAD MODAL */}
      {downloadType && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h3>Download Confirmation</h3>
            <p>Download {downloadType.toUpperCase()} file?</p>
            <div className="modal-actions">
              <button
                className="btn save-btn"
                onClick={() => {
                  downloadType === "pdf" ? downloadPDF() : downloadCSV();
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

      {/* DELETE MODAL */}
      {(deleteTarget || deleteAllMode) && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h3>Delete Confirmation</h3>
            <p>
              {deleteAllMode
                ? "Are you sure you want to delete ALL records?"
                : "Are you sure you want to delete this record?"}
            </p>
            <div className="modal-actions">
              <button className="btn delete-btn" onClick={confirmDelete}>
                Confirm
              </button>
              <button
                className="btn cancel-btn"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteAllMode(false);
                          }}
                          >
                          Cancel
                          </button>
                        </div>
                        </div>
                      </div>
                      )}

                      {fetchLoading ? (
                      <p style={{ textAlign: "center" }}>Loading...</p>
                      ) : (
                      <table className="data-table">
                        <thead>
                        <tr>
                          <th>No</th>
                          <th>Name</th>
                          <th>Country Code</th>
                          <th>Phone</th>
                          {isDevoteePage && <th>Date & Time</th>}
                          {(isDuplicatePage || isInvalidPage) && <th>Nakshatra</th>}
                          {isInvalidPage && <th>Reason</th>}
                          <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filteredData.map((item, index) => (
                          <tr key={item.id}>
                          <td>{index + 1}</td>

                          <td>
                            {editingId === item.id ? (
                            <input
                              value={editData.name}
                              onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                              }
                            />
                            ) : (
                            item.name
                            )}
                          </td>

                          <td>
                            {editingId === item.id ? (
                            <input
                              value={editData.country_code}
                              onChange={(e) =>
                              setEditData({ ...editData, country_code: e.target.value })
                              }
                            />
                            ) : (
                            item.country_code
                            )}
                          </td>

                          <td>
                            {editingId === item.id ? (
                            <input
                              value={editData.phone}
                              onChange={(e) =>
                              setEditData({ ...editData, phone: e.target.value })
                              }
                            />
                            ) : (
                            item.phone
                            )}
                          </td>

                          {isDevoteePage && (
                            <td>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                              : "-"}
                            </td>
                          )}

                          {(isDuplicatePage || isInvalidPage) && (
                            <td>
                            {editingId === item.id ? (
                              <select
                              value={editData.nakshatra || ""}
                              onChange={(e) =>
                                setEditData({ ...editData, nakshatra: e.target.value })
                              }
                              >
                              {editData.nakshatra &&
                                !NAKSHATRA_OPTIONS.includes(editData.nakshatra.toUpperCase()) && (
                                <option value={editData.nakshatra}>
                                  {editData.nakshatra} (Invalid)
                                </option>
                                )}

                              {NAKSHATRA_OPTIONS.map((nak) => (
                                <option key={nak} value={nak}>{nak}</option>
                              ))}
                              </select>
                            ) : (
                              item.nakshatra
                            )}
                            </td>
                          )}

                          {isInvalidPage && <td>{item.reason}</td>}

                          <td>
                            {editingId === item.id ? (
                            <>
                              {isInvalidPage ? (
                              <button
                                className="btn convert-btn"
                                onClick={() => handleConvert(item.id)}
                              >
                                Convert
                              </button>
                              ) : (
                              <button
                                className="btn save-btn"
                                onClick={() => handleUpdate(item.id)}
                              >
                                Save
                              </button>
                              )}
                              <button className="btn cancel-btn" onClick={cancelEdit}>
                              Cancel
                              </button>
                            </>
                            ) : (
                            <>
                              {!isDuplicatePage && (
                              <button
                                className="btn edit-btn"
                                onClick={() => startEdit(item)}
                              >
                                Edit
                              </button>
                              )}
                              <button
                              className="btn delete-btn"
                              onClick={() => setDeleteTarget(item.id)}
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
                      )}
                    </div>
                    );
                  }

                  export default NakshatraTable;
                        