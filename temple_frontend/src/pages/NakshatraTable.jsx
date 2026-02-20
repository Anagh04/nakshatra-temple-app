import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import "./NakshatraTable.css";

function NakshatraTable({ type = "devotees" }) {
  const { name } = useParams();
  const nakshatraName = name ? name.toUpperCase() : "";

  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");

  const isDuplicatePage = type === "duplicates";
  const isInvalidPage = type === "invalids";

  // ================= FETCH =================
  const fetchData = async () => {
    setFetchLoading(true);
    setError("");

    try {
      let endpoint = "";

      if (isDuplicatePage) endpoint = "duplicates/";
      else if (isInvalidPage) endpoint = "invalids/";
      else
        endpoint = `devotees/?nakshatra=${encodeURIComponent(
          nakshatraName
        )}`;

      const response = await API.get(endpoint);
      setData(response.data);
    } catch (err) {
      setError("Failed to fetch data.");
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

  // ================= START EDIT =================
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

  // ================= CONVERT INVALID =================
  const handleConvert = async (itemId) => {
    try {
      await API.post("devotees/", {
        name: editData.name.toUpperCase(),
        country_code: editData.country_code,
        phone: editData.phone,
        nakshatra: editData.nakshatra.toUpperCase(),
      });

      await API.delete(`invalids/${itemId}/`);

      setEditingId(null);
      fetchData();
      alert("Converted successfully!");
    } catch (err) {
      alert("Conversion failed. Check Nakshatra value.");
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
    } catch (err) {}
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

                {isDuplicatePage && <th>Nakshatra</th>}

                {isInvalidPage ? (
                  <>
                    <th>Nakshatra</th>
                    <th>Reason</th>
                  </>
                ) : !isDuplicatePage ? (
                  <th>Date & Time</th>
                ) : (
                  <th>Date & Time</th>
                )}

                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No data found
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    {/* NAME */}
                    <td>
                      {editingId === item.id ? (
                        <input
                          value={editData.name}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        item.name
                      )}
                    </td>

                    {/* COUNTRY CODE */}
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

                    {/* DUPLICATE PAGE */}
                    {isDuplicatePage && <td>{item.nakshatra}</td>}

                    {/* INVALID PAGE */}
                    {isInvalidPage ? (
                      <>
                        <td>
                          {editingId === item.id ? (
                            <input
                              value={editData.nakshatra}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  nakshatra: e.target.value,
                                })
                              }
                            />
                          ) : (
                            item.nakshatra
                          )}
                        </td>
                        <td>{item.reason}</td>
                      </>
                    ) : (
                      <td>
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleString()
                          : "-"}
                      </td>
                    )}

                    {/* ACTION */}
                    <td>
                      {editingId === item.id ? (
                        <>
                          <button
                            style={{
                              marginRight: "10px",
                              background: "green",
                            }}
                            onClick={() =>
                              handleConvert(item.id)
                            }
                          >
                            Save & Convert
                          </button>
                          <button onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {isInvalidPage && (
                            <button
                              style={{
                                marginRight: "10px",
                                backgroundColor: "#28a745",
                                color: "white",
                              }}
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDelete(item.id)
                            }
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
        )}
      </div>
    </div>
  );
}

export default NakshatraTable;