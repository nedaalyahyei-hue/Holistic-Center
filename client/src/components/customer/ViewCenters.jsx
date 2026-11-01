
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function CustomerCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3002/customer/centers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load centers");
        return res.json();
      })
      .then((data) => {
        if (data.message === "success") {
          setCenters(data.centers);
        } else {
          setError(data.message);
        }
      })
      .catch(() => setError("Failed to load centers"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CustomerLayout>
      <div className="centers-content">
        <h1>Discover our Trusted Centers</h1>

        {loading && <p>Loading centers...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && centers.length === 0 && (
          <p>No centers available yet.</p>
        )}

        <div className="centers-grid">
          {centers.map((center) => (
            <div className="center-card-customer" key={center._id}>
              <img
                src={center.image || "/logo.png"}
                alt={center.centerName}
              />

              <h3>{center.centerName}</h3>
              <p>{center.location || "Location not available"}</p>

              <Link to={`/customer/center-details/${center._id}`}>
                <button type="button">View Center</button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
}
