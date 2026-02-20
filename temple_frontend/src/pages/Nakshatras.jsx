import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../services/api";
import "./Nakshatras.css";

function Nakshatras() {
  const navigate = useNavigate();

  const [duplicateCount, setDuplicateCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  // ✅ MUST MATCH BACKEND EXACTLY
  const nakshatras = [
    "ASWATHY","BHARANI","KARTHIKA","ROHINI","MAKAYIRAM",
    "THIRUVATHIRA","PUNARTHAM","POOYAM","AYILYAM","MAKAM",
    "POORAM","UTHRAM","ATHAM","CHITHIRA","CHOTHI",
    "VISHAKHAM","ANIZHAM","THRIKKETTA","MOOLAM",
    "POORADAM","UTHRADAM","THIRUVONAM","AVITTAM",
    "CHATHAYAM","POORURUTTATHI","UTHRUTTATHI","REVATHI"
  ];

  // ================= FETCH COUNTS =================
  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [dup, inv] = await Promise.all([
        API.get("duplicates/"),
        API.get("invalids/")
      ]);

      setDuplicateCount(dup.data.length);
      setInvalidCount(inv.data.length);

    } catch (err) {
      console.error("Failed to fetch counts", err);
    }
  };

  return (
    <div className="nakshatra-container">

      <div className="nakshatra-header">
        <h2>Select Nakshatra</h2>
      </div>

      <div className="nakshatra-grid">

        {/* NORMAL NAKSHATRAS */}
        {nakshatras.map((n, index) => (
          <div
            key={index}
            className="nakshatra-card"
            onClick={() => navigate(`/nakshatras/${encodeURIComponent(n)}`)}
          >
            {n}
          </div>
        ))}

        {/* DUPLICATE CARD */}
        <div
          className={`nakshatra-card duplicate-card ${
            duplicateCount > 0 ? "alert-card" : ""
          }`}
          onClick={() => navigate("/duplicates")}
        >
          DUPLICATE ENTRIES
          {duplicateCount > 0 && (
            <span className="card-badge">{duplicateCount}</span>
          )}
        </div>

        {/* INVALID CARD */}
        <div
          className={`nakshatra-card invalid-card ${
            invalidCount > 0 ? "alert-card" : ""
          }`}
          onClick={() => navigate("/invalids")}
        >
          INVALID ENTRIES
          {invalidCount > 0 && (
            <span className="card-badge">{invalidCount}</span>
          )}
        </div>

      </div>

    </div>
  );
}

export default Nakshatras;