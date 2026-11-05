import React, { useEffect, useState } from "react";
import "./Admin.css";

export default function TreatmentManagement() {
  const [treatments, setTreatments] = useState([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const addTreatment = async () => {
    if (!name.trim()) {
      alert("Please enter treatment name");
      return;
    }

    try {
      const response = await fetch("http://localhost:3002/admin/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (data.message === "success") {
        setTreatments((prev) =>
          [...prev, data.treatment].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setName("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Failed to add treatment");
    }
  };

  useEffect(() => {
    fetch("http://localhost:3002/admin/treatments")
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success") {
          setTreatments(data.treatments);
        } else {
          setError(data.message);
        }
      })
      .catch(() => setError("Failed to load treatments"));
  }, []);

  const saveEdit = async () => {
    if (!name.trim()) {
      alert("Please enter treatment name");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3002/admin/treatments/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }
      );

      const data = await response.json();

      if (data.message === "success") {
        setTreatments((prev) =>
          prev
            .map((t) => (t._id === editingId ? data.treatment : t))
            .sort((a, b) => a.name.localeCompare(b.name))
        );

        setName("");
        setEditingId(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Failed to update treatment");
    }
  };

  return (
    <div className="admin-page">
      <div className="overlay">
        <div className="content-wrapper">
          <h2 className="title">Treatment Management</h2>

          <div className="management-card">
            <input
              className="input"
              type="text"
              placeholder="Enter treatment name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="remove-btn"
              onClick={editingId ? saveEdit : addTreatment}
              style={{ background: "#76a37b" }}
            >
              {editingId ? "Save Changes" : "Add Treatment"}
            </button>
            
            <h3 style={{ margin: 0, color: "#3b3f2e" }}>
              Treatment List
            </h3>

            {error && (
              <p style={{ color: "#c0392b" }}>{error}</p>
            )}

            {treatments.length === 0 && !error ? (
              <p>No treatments added yet.</p>
            ) : (
              <div className="records-grid" style={{ width: "100%" }}>
                {treatments.map((treatment) => (
                  <div
                    className="dashboard-record-card"
                    key={treatment._id}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "15px",
                      }}
                    >
                      <span>{treatment.name}</span>

                      <button
                        onClick={() => {
                          setEditingId(treatment._id);
                          setName(treatment.name);
                        }}
                        style={{
                          background: "#76a37b",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}