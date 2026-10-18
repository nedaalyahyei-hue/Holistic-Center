import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";
import F1 from "../../assets/F1.jpg";

export default function TreatmentBooking() {
  const navigate = useNavigate();

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

  // اليوم ما يصير يتحجز لو كان جمعة أو يوم عدى
  function isDisabled(day) {
    const date = new Date(year, month, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date.getDay() === 5 || date < todayStart;
  }

  function confirmBooking() {
    const date = `${selectedDay} ${months[month]} ${year}`;
    navigate("/customer/booking-confirmation", { state: { date: date } });
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
          <img src={F1} alt="Hijama" />
          <p>Cupping therapy is a traditional treatment that uses special cups to create suction on the skin. It helps stimulate blood circulation, relieve tension, and promote overall well being</p>
        </div>
        <div className="booking-details-row">
          <div className="booking-info-card">
            <p><strong>Hijama</strong> (Cupping Therapy)</p>
            <p>Center: Abna Freish Center</p>
            <p>Price: <span>10 OMR</span></p>
            <p>Duration: 45 minutes</p>
            <div className="booking-location"><p>Location: Muscat</p><MdLocationOn /><p>Al Seeb</p></div>
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
          </div>
        </div>
        <button className="booking-btn" onClick={confirmBooking} disabled={!selectedDay}>Confirm Booking</button>
        <button className="booking-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </CustomerLayout>
  );
}