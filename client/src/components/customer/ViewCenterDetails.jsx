
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function CenterDetails() {
  const { centerId } = useParams();

  const [center, setCenter] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId) {
      setError("Please select a center first");
      setLoading(false);
      return;
    }

    const loadCenter = async () => {
      try {
        const response = await fetch(
          `http://localhost:3002/customer/centers/${centerId}/treatments`
        );

        const data = await response.json();

        if (!response.ok || data.message !== "success") {
          throw new Error(data.message || "Failed to load center");
        }

        setCenter(data.center);
        setTreatments(data.treatments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCenter();
  }, [centerId]);

  return (
    <CustomerLayout>
      <div className="center-details-page">
        {loading && <p>Loading center details...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && center && (
          <>
            <div className="center-details-logo-box">
              <img
                src={center.image || "/logo.png"}
                alt={center.centerName}
              />
              <h2>{center.centerName}</h2>
              <p>{center.location || "Location not available"}</p>
            </div>

            <div className="treatment-list">
              {treatments.length === 0 ? (
                <p>No treatments available for this center yet.</p>
              ) : (
                treatments.map((item) => (
                  <div className="treatment-card" key={item._id}>
                    <img
                      src={item.image || "/logo.png"}
                      alt={item.name || item.trName}
                    />

                    <div className="treatment-info">
                      <p>{item.name || item.trName}</p>
                      <span>{item.price} OMR</span>
                    </div>

                    <Link
                      to={`/customer/appointment-book/${item._id}`}
                    >
                      <button type="button">Details</button>
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="reviews-section">
              <h3>Customers Reviews</h3>
              <div className="reviews-box">
                <p>No reviews available yet.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
