import { useNavigate } from "react-router-dom";
import "./Nakshatras.css";

function Nakshatras() {
  const navigate = useNavigate();

  const nakshatras = [
    "ASWATHY","BHARANI","KARTHIKA","ROHINI","MAKAYIRAM","THIRUVATHIRA",
    "PUNARTHAM","POOYAM","AYILYAM","MAKAM","POORAM",
    "UTHRAM","ATHAM","CHITHRIA","CHOTHI","VISHAKHAM",
    "ANIZHAM","THRIKKETTA","MOOLAM","POORADAM",
    "UTHRADAM","THIRUVONAM","AVITTAM",
    "CHATHAYAM","POORURUTTATHI",
    "UTHRUTTATHI","REVATHI"
  ];

  return (
    <div className="nakshatra-container">

      <div className="nakshatra-header">
        <h2>Select Nakshatra</h2>
      </div>

      <div className="nakshatra-grid">
        {nakshatras.map((n, index) => (
          <div
            key={index}
            className="nakshatra-card"
            onClick={() => navigate(`/nakshatras/${encodeURIComponent(n)}`)}
          >
            {n}
          </div>
        ))}
      </div>

    </div>
  );
}

export default Nakshatras;
