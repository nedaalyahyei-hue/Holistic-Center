import { BrowserRouter, Routes, Route } from "react-router-dom";

// AUTH
import Home from "./components/auth/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgetPassword from "./components/auth/ForgetPassword";
import ResetPassword from "./components/auth/ResetPassword";

// ADMIN
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminManagement from "./components/admin/AdminManagement";
import RegisterCenter from "./components/admin/RegisterCenter";
import AdminMessages from "./components/admin/AdminMessages";

// CENTER
import CenterDashboard from "./components/center/CenterDashboard";
import CenterManagement from "./components/center/CenterManagement";
import CenterProfile from "./components/center/CenterProfile";
import AddTreatment from "./components/center/AddTreatment";
import EditTretment from "./components/center/EditTreatment";
import UpdateandCancelAppointment from "./components/center/UpdateandCancelAppointment";
import UpdateAppointment from "./components/center/UpdateAppointment";
import AppointmentRefundApproval from "./components/center/AppointmentRefundApprovel";


// CUSTOMER
import UpdateUserProfile from "./components/customer/UpdateUserProfile";
import ViewCenters from "./components/customer/ViewCenters";
import ViewCenterDetails from "./components/customer/ViewCenterDetails";
import AppointmentBook from "./components/customer/AppointmentBook";
import Payment from "./components/customer/Payment";
import AppointmentsHistory from "./components/customer/AppointmentsHistory";
import Review from "./components/customer/Review";
import UserDashboard from "./components/customer/UserDashboard";
import Chatbot from "./components/customer/Chatbot";
import Contact from "./components/customer/Cnotact.jsx";
import BookingConfirmation from "./components/customer/BookingConfirmation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/management" element={<AdminManagement />} />
        <Route path="/admin/register-center" element={<RegisterCenter />} />
        <Route path="/admin/messages" element={<AdminMessages />} />

        <Route path="/center/dashboard" element={<CenterDashboard />} />
        <Route path="/center/management" element={<CenterManagement />} />
        <Route path="/center/center-profile" element={<CenterProfile />} />
        <Route path="/center/add-treatment" element={<AddTreatment />} />
        <Route path="/center/edit-treatment" element={<EditTretment />} />
        <Route path="/center/management-appointment" element={<UpdateandCancelAppointment />} />
        <Route path="/center/update-appointment" element={<UpdateAppointment />} />
        <Route path="/center/appointment-refundApproval" element={<AppointmentRefundApproval />} />

        <Route path="/customer/update-profile" element={<UpdateUserProfile />} />
        <Route path="/customer/centers" element={<ViewCenters />} />
        <Route path="/customer/center-details" element={<ViewCenterDetails />} />
        <Route path="/customer/center-details/:centerId" element={<ViewCenterDetails />} />
        <Route path="/customer/appointment-book" element={<AppointmentBook />} />
        <Route path="/customer/booking-confirmation" element={<BookingConfirmation />} />
        <Route path="/customer/payment" element={<Payment />} />
        <Route path="/customer/history" element={<AppointmentsHistory />} />
        <Route path="/customer/review" element={<Review />} />
        <Route path="/customer/dashboard" element={<UserDashboard />} />
        <Route path="/customer/chatbot" element={<Chatbot />} />
        <Route path="/customer/contact" element={<Contact />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
