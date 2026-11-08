import React, { useState, useEffect } from "react";
import CustomerLayout from "./CustomerLayout";
import { FaPhoneAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import "./Customer.css";

export default function Contact() {

  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");

  const loadCenters = () => {
    fetch("http://localhost:3002/customer/centers")
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "success") {
          setCenters(data.centers || []);
        }
      })
      .catch((error) => console.error("Error loading centers:", error));
  };

  useEffect(() => {
    loadCenters();

    // a center can change its phone number while this page is open
    window.addEventListener("focus", loadCenters);
    return () => window.removeEventListener("focus", loadCenters);
  }, []);

  const selectedCenter = centers.find(
    (center) => center._id === selectedCenterId
  );

  return (
    <CustomerLayout>
      <div className="contact-content">
        <h1>Contact With Center</h1>
        <p className="contact-subtitle">
          We are here to help you on your wellness journey.
        </p>

        <div className="contact-card">

          <div className="contact-select">
            <label htmlFor="centerSelect">Select Center</label>

            <select
              id="centerSelect"
              value={selectedCenterId}
              onChange={(e) => {
                setSelectedCenterId(e.target.value);
                loadCenters();
              }}
            >
              <option value="">Choose a center</option>

              {centers.map((center) => (
                <option key={center._id} value={center._id}>
                  {center.centerName}
                </option>
              ))}
            </select>
          </div>

          <div className="contact-row">
            <div className="contact-icon">
              <FaPhoneAlt />
            </div>
            {selectedCenter && (
              selectedCenter.phone ? (
                <p>
                  Contact:{" "}
                  <a href={`tel:${selectedCenter.phone}`}>
                    {selectedCenter.phone}
                  </a>
                </p>
              ) : (
                <p>Contact: Not available</p>
              )
            )}
          </div>

          <div className="contact-line"></div>

          <div className="contact-row">
            <div className="contact-icon">
              <MdEmail />
            </div>
            {selectedCenter && (
              <p>
                <a href={`mailto:${selectedCenter.email}`}>
                  {selectedCenter.email}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}