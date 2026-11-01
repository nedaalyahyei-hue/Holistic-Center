import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";
import F1 from "../../assets/F1.jpg";

export default function TreatmentBooking() {
  const navigate = useNavigate();
  const { treatmentId } = useParams();
  const [treatment, setTreatment] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3002/treatments/${treatmentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success") {
          setTreatment(data.treatment);
        }
      })
      .catch((error) => console.error("Error loading treatment:", error));
  }, [treatmentId]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  // أول يوم في الشهر وعدد الأيام
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  }

useEffect(() => {
  setSelectedSlot(null);

  if (!selectedDay || !treatmentId) {
    setAvailableSlots([]);
    return;
  }

  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  fetch(`http://localhost:3002/treatments/${treatmentId}/availability/${date}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "success" && data.open) {
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    })
    .catch((error) => {
      console.error("Error loading available slots:", error);
      setAvailableSlots([]);
    });
}, [selectedDay, month, year, treatmentId]);

  function isDisabled(day) {
  const date = new Date(year, month, day);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const isPast = date < todayStart;
  const isClosed = !treatment?.workDays?.includes(date.getDay());

  return isPast || isClosed;
}
  function confirmBooking() {
  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  navigate("/customer/booking-confirmation", {
    state: {
      treatment,
      treatmentId,
      date,
      slotStart: selectedSlot
    }
  });
}

  // أرقام الأيام مع فراغات في البداية
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<span key={"empty" + i}></span>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(
      <span
        key={day}
        className={
          "calendar-day" +
          (selectedDay === day ? " selected" : "") +
          (isDisabled(day) ? " disabled" : "")
        }
        onClick={() => !isDisabled(day) && setSelectedDay(day)}
      >
        {day}
      </span>
    );
  }

  return (
    <CustomerLayout>
      <div className="booking-content">
        <h1>Treatment Booking</h1>
        <div className="booking-description-card">
          <img src={F1} alt="Treatment" />
          <p>{treatment?.description || "No description available."}</p>
        </div>
        <div className="booking-details-row">
          <div className="booking-info-card">
            <p><strong>{treatment?.name || treatment?.trName}</strong></p>
            <p>Price: <span>{treatment?.price} OMR</span></p>
            <p>Duration: {treatment?.duration} minutes</p>
            <div className="booking-location">
              <MdLocationOn />
              <p>Location: {treatment?.location || "Not available"}</p>
            </div>
          </div>
          <div className="booking-date-card">
            <h3>Select Date</h3>
            <div className="booking-month">
              <IoIosArrowBack onClick={prevMonth} />
              <span>{months[month]} {year}</span>
              <IoIosArrowForward onClick={nextMonth} />
            </div>
            <div className="calendar-grid">
              {days.map((d) => <span key={d}>{d}</span>)}
              {calendarDays}
            </div>

            {selectedDay && (
  <div className="booking-time-slots">
    <h3>Select Time</h3>

    {availableSlots.length > 0 ? (
      availableSlots.map((slot, index) => (
        <button
          key={index}
          type="button"
          className={selectedSlot === slot.start ? "selected" : ""}
          onClick={() => setSelectedSlot(slot.start)}
        >
          {slot.start}
        </button>
      ))
    ) : (
      <p>No available time slots for this date.</p>
    )}
  </div>
)}
          </div>
        </div>
        <button className="booking-btn" onClick={confirmBooking} disabled={!selectedDay || !selectedSlot}>Confirm Booking</button>
        <button className="booking-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </CustomerLayout>
  );
}