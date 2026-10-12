 import React from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";
import F1 from "../../assets/F1.jpg";

export default function TreatmentBooking() {
  const navigate = useNavigate();

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
            <div className="booking-month"><IoIosArrowBack /><span>May 2026</span><IoIosArrowForward /></div>
            <div className="calendar-grid">
              <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
              <span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span><span>16</span>
              <span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span>
            </div>
          </div>
        </div>
        <button className="booking-btn" onClick={() => navigate("/customer/payment")}>Confirm Booking</button>
        <button className="booking-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </CustomerLayout>
  );
}
