import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [fetchLoading, setFetchLoading] = useState(false);

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

  // ================= EDIT =================
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      country_code: item.country_code,
      phone: item.phone,
      nakshatra: item.nakshatra || nakshatraName,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // ================= UPDATE DEVOTEE =================
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
      alert("Update failed");
    }
  };

  // ================= CONVERT INVALID =================
  const handleConvert = async (id) => {
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
      alert("Conversion failed");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      let endpoint = "";
      if (isDuplicatePage) endpoint = `duplicates/${id}/`;
      else if (isInvalidPage) endpoint = `invalids/${id}/`;
      else endpoint = `devotees/${id}/`;

      await API.delete(endpoint);
      fetchData();
    } catch {
      alert("Delete failed");
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

      {fetchLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Country Code</th>
              <th>Phone</th>
              {(isDuplicatePage || isInvalidPage) && <th>Nakshatra</th>}
              {isInvalidPage && <th>Reason</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
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

                {(isDuplicatePage || isInvalidPage) && (
                  <td>
                    {editingId === item.id && isInvalidPage ? (
                      <select
                        value={editData.nakshatra}
                        onChange={(e) =>
                          setEditData({ ...editData, nakshatra: e.target.value })
                        }
                      >
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

                <td>
                  {editingId === item.id ? (
                    <>
                      {isInvalidPage ? (
                        <button onClick={() => handleConvert(item.id)}>
                          Convert
                        </button>
                      ) : (
                        <button onClick={() => handleUpdate(item.id)}>
                          Save
                        </button>
                      )}
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {!isDuplicatePage && (
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
  );
}

export default NakshatraTable;