import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";
import "./NakshatraTable.css";

const NAKSHATRA_OPTIONS = [
  "ASHWATHY","BHARANI","KARTHIKA","ROHINI","MAKAYIRAM","THIRUVATHIRA",
  "PUNARTHAM","POOYAM","AYILYAM","MAKAM","POORAM","UTHRAM",
  "ATHAM","CHITHIRA","CHOTHI","VISHAKAM","ANIZHAM","THRIKKETTA",
  "MOOLAM","POORADAM","UTHRADAM","THIRUVONAM","AVITTAM","CHATHAYAM",
  "POORURUTTATHI","UTHRATTATHI","REVATHI"
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
      console.error(err);
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

    const matchesNakshatra =
      !selectedNakshatra || item.nakshatra === selectedNakshatra;

    return matchesSearch && matchesNakshatra;
  });

  // ================= EDIT =================
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      country_code: item.country_code,
      phone: item.phone,
      nakshatra: item.nakshatra || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // ================= UPDATE DEVOTEE =================
  const handleUpdate = async (id) => {
    await API.put(`devotees/${id}/`, {
      ...editData,
      name: editData.name.toUpperCase(),
      nakshatra: nakshatraName,
    });

    cancelEdit();
    fetchData();
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

    await API.post("devotees/", {
      name: editData.name.toUpperCase(),
      country_code: editData.country_code,
      phone: editData.phone,
      nakshatra: editData.nakshatra.toUpperCase(),
    });

    await API.delete(`invalids/${id}/`);

    cancelEdit();
    fetchData();
    alert("Converted Successfully");
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    const endpoint = isDuplicatePage
      ? `duplicates/${id}/`
      : isInvalidPage
      ? `invalids/${id}/`
      : `devotees/${id}/`;

    await API.delete(endpoint);
    fetchData();
  };

  const handleDeleteAll = async () => {
    setLoading(true);

    if (isDuplicatePage) await API.delete("delete-all-duplicates/");
    else if (isInvalidPage) await API.delete("delete-all-invalids/");
    else await API.delete(`delete-nakshatra/${nakshatraName}/`);

    setShowConfirmPopup(false);
    fetchData();
    setLoading(false);
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
            item.reason,
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

    const csv = XLSX.write(workbook, {
      bookType: "csv",
      type: "array",
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, "data.csv");
  };

  return (
    <div className="table-container">

      {/* HEADER */}
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
          <button onClick={() => setShowConfirmPopup(true)}>
            Delete All
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* DUPLICATE FILTER */}
      {isDuplicatePage && (
        <div className="filter-box">
          <select
            value={selectedNakshatra}
            onChange={(e) => setSelectedNakshatra(e.target.value)}
          >
            <option value="">All Nakshatras</option>
            {[...new Set(data.map((d) => d.nakshatra))].map((nak) => (
              <option key={nak} value={nak}>
                {nak}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* TABLE */}
      <div className="table-wrapper">
        {fetchLoading ? (
          <div>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Country Code</th>
                <th>Phone</th>
                {(isDuplicatePage || isInvalidPage) && <th>Nakshatra</th>}
                {isInvalidPage && <th>Reason</th>}
                {!isInvalidPage && <th>Date & Time</th>}
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>

                  {/* NAME */}
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

                  {/* COUNTRY */}
                  <td>
                    {editingId === item.id ? (
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
                      item.country_code
                    )}
                  </td>

                  {/* PHONE */}
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

                  {/* NAKSHATRA */}
                  {(isDuplicatePage || isInvalidPage) && (
                    <td>
                      {editingId === item.id && isInvalidPage ? (
                        <select
                          value={editData.nakshatra}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              nakshatra: e.target.value,
                            })
                          }
                        >
                          <option value="">Select</option>
                          {NAKSHATRA_OPTIONS.map((nak) => (
                            <option key={nak} value={nak}>
                              {nak}
                            </option>
                          ))}
                        </select>
                      ) : (
                        item.nakshatra
                      )}
                    </td>
                  )}

                  {isInvalidPage && <td>{item.reason}</td>}

                  {!isInvalidPage && (
                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "-"}
                    </td>
                  )}

                  <td>
                    {editingId === item.id ? (
                      <>
                        {isInvalidPage ? (
                          <button onClick={() => handleConvert(item.id)}>
                            Save & Convert
                          </button>
                        ) : (
                          isDevoteePage && (
                            <button onClick={() => handleUpdate(item.id)}>
                              Save
                            </button>
                          )
                        )}
                        <button onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        {(isDevoteePage || isInvalidPage) && (
                          <button onClick={() => startEdit(item)}>
                            Edit
                          </button>
                        )}
                        <button onClick={() => handleDelete(item.id)}>
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

      {/* CONFIRM POPUP */}
      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>Are you sure?</h3>
            <button onClick={() => setShowConfirmPopup(false)}>
              Cancel
            </button>
            <button onClick={handleDeleteAll}>
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NakshatraTable;