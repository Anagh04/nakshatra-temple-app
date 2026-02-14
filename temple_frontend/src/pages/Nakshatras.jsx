import { useNavigate } from "react-router-dom";
import "./Nakshatras.css";

function Nakshatras() {
  const navigate = useNavigate();

  const nakshatras = [
    "Aswathy","Bharani","Karthika","Rohini","Makayiram","Thiruvathira",
    "Punartham","Pooyam","Ayilyam","Makam","Pooram",
    "Uthram","Atham","Chithria","Chothi","Vishakham",
    "Anizham","Thrikketta","Moolam","Pooradam",
    "Uthradam","Thiruvonam","Avittam",
    "Chathayam","Pooruruttathi",
    "Uthruttathi","Revathi"
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
            onClick={() => navigate(`/nakshatras/${n}`)}
          >
            {n}
          </div>
        ))}
      </div>

    </div>
  );
}

export default Nakshatras;
