import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//added to make database work
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const conStr =
  "mongodb+srv://admin:admin123@hct-cluster.czj4w6k.mongodb.net/HCSDB?retryWrites=true&w=majority&appName=HCT-Cluster";

mongoose
  .connect(conStr)
  .then(() => console.log("Database Connected..."))
  .catch((error) => console.log("Database Error: " + error));

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone: String,
  password: String,

  role: {
    type: String,
    default: "customer",
  },

  image: String,
  description: String,
  location: String,
  locations: [
    {
      name: { type: String, required: true },
      mapUrl: { type: String, required: true },
    },
  ],

  resetCode: String,
  resetCodeExpiry: Date,
}, { timestamps: true });

const UserModel = mongoose.model("USER", UserSchema, "USER");
const CenterSchema = new mongoose.Schema(
  {
    centerName: String,
    email: String,
    phone: String,
    image: String,
    isActive: String,
    location: String,
  },
  { timestamps: true }
);

const CenterModel = mongoose.model("CENTER", CenterSchema, "CENTER");

// Register API
app.post("/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (user) {
      return res.send({ message: "User Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      username,
      email,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    res.send({ message: "User Registered" });
  } catch (error) {
    res.send({ message: "Register Error: " + error });
  }
});


// Register Center API
app.post("/register-center", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (user) {
      return res.send({ message: "Center Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCenter = new UserModel({
      username,
      email,
      phone,
      password: hashedPassword,
      role: "center",
    });

    await newCenter.save();
    await CenterModel.create({
      centerName: username,
      email,
      phone,
      image: "",
      isActive: "true",
      location: "",
    });
    res.send({ message: "success" });
  } catch (error) {
    res.send({ message: "Center Register Error: " + error.message });
  }
});


// Login API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    // user login
    if (!user) {
      return res.send({
        message: "Invalid Email",
      });
    }

    // admin & center login
    if (user.role === "admin" || user.role === "center") {

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.send({
          message: "Email or Password Invalid",
        });
      }

      return res.send({
        message: "success",
        user: user,
      });
    }

    // user login
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.send({
        message: "Invalid Password",
      });
    }

    res.send({
      message: "success",
      user: user,
    });

  } catch (error) {
    res.send({
      message: "Login Error: " + error.message,
    });
  }
});

// Forgot Password API
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.send({ message: "Email not found" });
    }

    // generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = code;
    user.resetCodeExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code",
      html: `
        <h2>Password Reset</h2>
        <p>Your verification code is:</p>
        <h1>${code}</h1>
        <p>This code expires in 15 minutes.</p>
      `,
    });

    res.send({ message: "Reset code sent successfully" });

  } catch (error) {
    res.send({ message: "Email Error: " + error.message });
  }
});


// Reset Password API
app.post("/reset-password", async (req, res) => {
  try {
    const { email, code, password } = req.body;

    const user = await UserModel.findOne({
      email,
      resetCode: code,
      resetCodeExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.send({ message: "Invalid or expired code" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await user.save();

    res.send({ message: "Password updated successfully" });
  } catch (error) {
    res.send({ message: "Reset Error: " + error.message });
  }
});

// ================= Center Profile =================

// Get center data (without password)
app.get("/center/:id", async (req, res) => {
  try {
    const center = await UserModel.findOne({
      _id: req.params.id,
      role: "center",
    }).select("-password -resetCode -resetCodeExpiry");

    if (!center) return res.send({ message: "Center not found" });

    res.send({ message: "success", center });
  } catch (error) {
    res.send({ message: "Get Center Error: " + error.message });
  }
});

// Update center data (phone, image, description, locations)
app.put("/center/:id", async (req, res) => {
  try {
    const { phone, image, description, locations } = req.body;

    // keep only valid locations (name + link both filled)
    const cleanLocations = (locations || [])
      .filter((l) => l.name && l.name.trim() && l.mapUrl && l.mapUrl.trim())
      .map((l) => ({ name: l.name.trim(), mapUrl: l.mapUrl.trim() }));

    const center = await UserModel.findOneAndUpdate(
      { _id: req.params.id, role: "center" },
      { phone, image, description, locations: cleanLocations },
      { new: true }
    ).select("-password -resetCode -resetCodeExpiry");

    if (!center) return res.send({ message: "Center not found" });

    res.send({ message: "success", center });
  } catch (error) {
    res.send({ message: "Update Center Error: " + error.message });
  }
});

// Get all centers from MongoDB
app.get("/admin/centers", async (req, res) => {
  try {
    const centers = await CenterModel.find({});
    res.status(200).json(centers);
  } catch (error) {
    console.error("Get Centers Error:", error);
    res.status(500).json({
      message: "Failed to fetch centers",
    });
  }
});

// Update Center Name
app.put("/admin/centers/:id", async (req, res) => {
  try {
    const { centerName } = req.body;

    if (!centerName || !centerName.trim()) {
      return res.status(400).json({
        message: "Center name is required",
      });
    }

    const updatedCenter = await CenterModel.findByIdAndUpdate(
      req.params.id,
      { centerName: centerName.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedCenter) {
      return res.status(404).json({
        message: "Center not found",
      });
    }

    res.status(200).json({
      message: "Center updated successfully",
      center: updatedCenter,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update center",
    });
  }
});

// Delete Center
app.delete("/admin/centers/:id", async (req, res) => {
  try {
    const deletedCenter = await CenterModel.findByIdAndDelete(req.params.id);

    if (!deletedCenter) {
      return res.status(404).json({
        message: "Center not found",
      });
    }

    res.status(200).json({
      message: "Center deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete center",
    });
  }
});

// Get total customers
app.get("/admin/customers/count", async (req, res) => {
  try {
    const totalCustomers = await UserModel.countDocuments({
      role: "customer",
    });

    res.status(200).json({ totalCustomers });
  } catch (error) {
    console.error("Get Customers Count Error:", error);
    res.status(500).json({
      message: "Failed to fetch customers count",
    });
  }
});

// Get customers from MongoDB
app.get("/admin/customers", async (req, res) => {
  try {
    const customers = await UserModel.find({ role: "customer" })
      .select("username email");

    res.status(200).json(customers);
  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(500).json({
      message: "Failed to fetch customers",
    });
  }
});

// Customer and Admin Messages
const MessageSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: true,
    },
    customerName: String,
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("MESSAGE", MessageSchema, "MESSAGE");

// Send Message
app.post("/messages", async (req, res) => {
  try {
    const { customerId, customerName, sender, text } = req.body;

    if (!customerId || !text?.trim() || !["user", "admin"].includes(sender)) {
      return res.status(400).send({ message: "Invalid message data" });
    }

    const message = await MessageModel.create({
      customerId,
      customerName,
      sender,
      text: text.trim(),
    });

    res.send({ message: "success", data: message });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Get All Messages for Admin
app.get("/messages", async (req, res) => {
  try {
    const messages = await MessageModel.find().sort({ createdAt: 1 });

    res.send({
      message: "success",
      messages,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Mark Customer Messages as Read
app.put("/messages/read/:customerId", async (req, res) => {
  try {
    await MessageModel.updateMany(
      {
        customerId: req.params.customerId,
        sender: "user",
        isRead: { $ne: true },
      },
      { $set: { isRead: true } }
    );

    res.send({ message: "success" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// ================= Treatment =================
const TreatmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    location: String,
    category: String,
    image: String,
    description: String,
    workDays: { type: [Number], default: [0, 1, 2, 3, 4, 6] }, // 0=Sun ... 6=Sat (Friday off)
    slots: [
      {
        start: { type: String, required: true }, // "09:00"
        end: { type: String, required: true },   // "09:45"
        doctor: { type: String, required: true },
      },
    ],
    // centerId = the _id of the center's login account in the USER collection
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: true,
    },
  },
  { timestamps: true }
);

const TreatmentModel = mongoose.model("TREATMENT", TreatmentSchema, "TREATMENT");
// Search centers by center name or treatment name
app.get("/search-centers", async (req, res) => {
  try {
    const search = (req.query.q || "").trim();

    const centers = await CenterModel.find({
      centerName: { $regex: search, $options: "i" }
    });

    const treatments = await TreatmentModel.find({
      name: { $regex: search, $options: "i" }
    }).populate("centerId", "username email");

    res.json({ centers, treatments });
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function checkSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return "Add at least one time slot";

  for (const s of slots) {
    if (!TIME_RE.test(s.start || "") || !TIME_RE.test(s.end || "")) return "Invalid time format";
    if (s.start >= s.end) return "Slot end time must be after start time";
    if (!s.doctor || !s.doctor.trim()) return "Each slot needs a doctor name";
  }

  // the same doctor cannot have two overlapping slots
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i], b = slots[j];
      if (a.doctor.trim() === b.doctor.trim() && a.start < b.end && b.start < a.end) {
        return `Overlapping slots for ${a.doctor.trim()}`;
      }
    }
  }
  return null;
}

app.post("/treatments", async (req, res) => {
  try {
    const err = checkSlots(req.body.slots);
    if (err) return res.send({ message: err });

    const treatment = new TreatmentModel(req.body);
    await treatment.save();
    res.send({ message: "success", treatment });
  } catch (error) {
    res.send({ message: "Add Treatment Error: " + error.message });
  }
});

app.get("/treatments/center/:centerId", async (req, res) => {
  try {
    const treatments = await TreatmentModel.find({
      centerId: req.params.centerId,
    }).sort({ createdAt: -1 });
    res.send({ message: "success", treatments });
  } catch (error) {
    res.send({ message: "Get Treatments Error: " + error.message });
  }
});

app.get("/treatments/:id", async (req, res) => {
  try {
    const treatment = await TreatmentModel.findById(req.params.id);
    if (!treatment) return res.send({ message: "Treatment not found" });
    res.send({ message: "success", treatment });
  } catch (error) {
    res.send({ message: "Get Treatment Error: " + error.message });
  }
});

app.put("/treatments/:id", async (req, res) => {
  try {
    if (req.body.slots !== undefined) {
      const err = checkSlots(req.body.slots);
      if (err) return res.send({ message: err });
    }
    const treatment = await TreatmentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!treatment) return res.send({ message: "Treatment not found" });
    res.send({ message: "success", treatment });
  } catch (error) {
    res.send({ message: "Update Treatment Error: " + error.message });
  }
});

app.delete("/treatments/:id", async (req, res) => {
  try {
    await TreatmentModel.findByIdAndDelete(req.params.id);
    res.send({ message: "success" });
  } catch (error) {
    res.send({ message: "Delete Treatment Error: " + error.message });
  }
});

// ================= Booking =================
const BookingSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: true,
    },
    treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: "TREATMENT" },
    treatmentName: { type: String, required: true },
    customerName: String,
    customerEmail: String,
    price: { type: Number, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: String,
    slotStart: String,
    slotEnd: String,
    doctor: String,
    status: { type: String, default: "confirmed" },
    changeType: { type: String, default: "" },        // "edit" or "cancel"
    changeStatus: { type: String, default: "none" },  // none | pending | approved | rejected
  },
  { timestamps: true }
);

// One customer per treatment + date + slot (old bookings without a slot are ignored)
BookingSchema.index(
  { treatmentId: 1, date: 1, slotStart: 1 },
  { unique: true, partialFilterExpression: { slotStart: { $type: "string" } } }
);

const BookingModel = mongoose.model("BOOKING", BookingSchema, "BOOKING");

// Slots of a treatment on a specific date, with booked flag
app.get("/treatments/:id/availability/:date", async (req, res) => {
  try {
    const { id, date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.send({ message: "Invalid date" });

    const treatment = await TreatmentModel.findById(id);
    if (!treatment) return res.send({ message: "Treatment not found" });

    const today = new Date().toISOString().slice(0, 10);
    const weekday = new Date(date + "T00:00:00Z").getUTCDay();

    if (date < today || !treatment.workDays.includes(weekday)) {
      return res.send({ message: "success", open: false, slots: [] });
    }

    const booked = await BookingModel.find({ treatmentId: id, date }).select("slotStart");
    const bookedSet = new Set(booked.map((b) => b.slotStart));

    const slots = [...treatment.slots]
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((s) => ({
        start: s.start,
        end: s.end,
        doctor: s.doctor,
        booked: bookedSet.has(s.start),
      }));

    res.send({ message: "success", open: true, slots });
  } catch (error) {
    res.send({ message: "Availability Error: " + error.message });
  }
});

// Add booking
app.post("/bookings", async (req, res) => {
  try {
    const { treatmentId, date, slotStart } = req.body;

    // old behaviour (test data without a treatment)
    if (!treatmentId) {
      const booking = new BookingModel(req.body);
      await booking.save();
      return res.send({ message: "success", booking });
    }

    const treatment = await TreatmentModel.findById(treatmentId);
    if (!treatment) return res.send({ message: "Treatment not found" });

    const slot = treatment.slots.find((s) => s.start === slotStart);
    if (!slot) return res.send({ message: "Invalid time slot" });

    const today = new Date().toISOString().slice(0, 10);
    const weekday = new Date(date + "T00:00:00Z").getUTCDay();
    if (!date || date < today) return res.send({ message: "Invalid date" });
    if (!treatment.workDays.includes(weekday)) {
      return res.send({ message: "The center is closed on this day" });
    }

    const booking = new BookingModel({
      centerId: treatment.centerId,
      treatmentId: treatment._id,
      treatmentName: treatment.name,
      price: treatment.price,
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      date,
      time: slot.start,
      slotStart: slot.start,
      slotEnd: slot.end,
      doctor: slot.doctor,
    });
    await booking.save();
    res.send({ message: "success", booking });
  } catch (error) {
    if (error.code === 11000) {
      return res.send({ message: "This time slot is already booked" });
    }
    res.send({ message: "Add Booking Error: " + error.message });
  }
});


 // Customer edits booking date and time
app.put("/bookings/:id/customer-edit", async (req, res) => {
  try {
    const { customerEmail, date, slotStart } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await BookingModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!customerEmail || booking.customerEmail !== customerEmail) {
      return res.status(403).json({
        message: "This booking does not belong to you",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") ||
        !Number.isFinite(Date.parse(date + "T00:00:00Z")) ||
        new Date(date + "T00:00:00Z").toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const today = new Date().toISOString().slice(0, 10);

    if (date < today) {
      return res.status(400).json({
        message: "Cannot select a past date",
      });
    }

    const treatment = await TreatmentModel.findById(booking.treatmentId);

    if (!treatment) {
      return res.status(404).json({ message: "Treatment not found" });
    }

    const weekday = new Date(date + "T00:00:00Z").getUTCDay();

    if (!treatment.workDays.includes(weekday)) {
      return res.status(400).json({
        message: "The center is closed on this day",
      });
    }

    const slot = treatment.slots.find(
      (s) => s.start === slotStart
    );

    if (!slot) {
      return res.status(400).json({
        message: "Invalid time slot",
      });
    }

    booking.date = date;
    booking.time = slot.start;
    booking.slotStart = slot.start;
    booking.slotEnd = slot.end;
    booking.doctor = slot.doctor;

    try {
      await booking.save();
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "This time slot is already booked",
        });
      }
      throw error;
    }

    res.json({ message: "success", booking });

  } catch (error) {
    res.status(500).json({
      message: "Update Booking Error: " + error.message,
    });
  }
});


// Get all bookings of one center
app.get("/bookings/center/:centerId", async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      centerId: req.params.centerId,
    }).sort({ date: -1 });
    res.send({ message: "success", bookings });
  } catch (error) {
    res.send({ message: "Get Bookings Error: " + error.message });
  }
});

// Get all bookings of one customer (booking history)
app.get("/bookings/customer/:email", async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      customerEmail: req.params.email,
    }).sort({ date: -1 });
    res.send({ message: "success", bookings });
  } catch (error) {
    res.send({ message: "Get Bookings Error: " + error.message });
  }
});

// Center asks the customer for permission (edit or cancel)
app.put("/bookings/:id/request-change", async (req, res) => {
  try {
    const { type } = req.body;
    if (!["edit", "cancel"].includes(type)) {
      return res.send({ message: "Invalid request type" });
    }
    const booking = await BookingModel.findByIdAndUpdate(
      req.params.id,
      { changeType: type, changeStatus: "pending" },
      { new: true }
    );
    if (!booking) return res.send({ message: "Booking not found" });
    res.send({ message: "success", booking });
  } catch (error) {
    res.send({ message: "Request Error: " + error.message });
  }
});

// Customer answers the request (approved: true / false)
app.put("/bookings/:id/respond", async (req, res) => {
  try {
    const { approved } = req.body;
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.send({ message: "Booking not found" });
    if (booking.changeStatus !== "pending") {
      return res.send({ message: "No pending request" });
    }
    booking.changeStatus = approved ? "approved" : "rejected";
    await booking.save();
    res.send({ message: "success", booking });
  } catch (error) {
    res.send({ message: "Respond Error: " + error.message });
  }
});

// Change the booking date (only if the customer approved an edit)
app.put("/bookings/:id/date", async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.send({ message: "Booking not found" });

    if (booking.changeType !== "edit" || booking.changeStatus !== "approved") {
      return res.send({ message: "Customer approval required" });
    }

    // validate the new date
    const newDate = req.body.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate || "")) {
      return res.send({ message: "Invalid date" });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (newDate < today) return res.send({ message: "Invalid date" });

    if (booking.treatmentId) {
      const treatment = await TreatmentModel.findById(booking.treatmentId);
      if (treatment) {
        const weekday = new Date(newDate + "T00:00:00Z").getUTCDay();
        if (!treatment.workDays.includes(weekday)) {
          return res.send({ message: "The center is closed on this day" });
        }
      }
    }

    booking.date = newDate;
    booking.changeType = "";
    booking.changeStatus = "none";
    try {
      await booking.save();
    } catch (e) {
      if (e.code === 11000) return res.send({ message: "This slot is already booked on that date" });
      throw e;
    }
    res.send({ message: "success", booking });
  } catch (error) {
    res.send({ message: "Update Date Error: " + error.message });
  }
});

// Cancel (delete) the booking (only if the customer approved a cancel)
app.delete("/bookings/:id", async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.send({ message: "Booking not found" });

    if (booking.changeType !== "cancel" || booking.changeStatus !== "approved") {
      return res.send({ message: "Customer approval required" });
    }

    await BookingModel.findByIdAndDelete(req.params.id);
    res.send({ message: "success" });
  } catch (error) {
    res.send({ message: "Cancel Error: " + error.message });
  }
});

// ================= Refund =================
const RefundSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "BOOKING", required: true },
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: "USER", required: true },
    treatmentName: String,
    customerName: String,
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    bookingDate: String,
    bookingTime: String,
    reason: { type: String, required: true },
    status: { type: String, default: "pending" }, // pending | approved | rejected
    decidedAt: Date,
  },
  { timestamps: true }
);

// one refund request per booking
RefundSchema.index({ bookingId: 1 }, { unique: true });

const RefundModel = mongoose.model("REFUND", RefundSchema, "REFUND");

// ================= Notification (for customers) =================
const NotificationSchema = new mongoose.Schema(
  {
    customerEmail: { type: String, required: true },
    type: { type: String, default: "refund" },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("NOTIFICATION", NotificationSchema, "NOTIFICATION");

// Customer submits a refund request
app.post("/refunds", async (req, res) => {
  try {
    const { bookingId, customerEmail, reason } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) return res.send({ message: "Invalid booking" });
    if (!reason || !reason.trim()) return res.send({ message: "Reason is required" });

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.send({ message: "Booking not found" });

    // the booking must belong to the customer who is asking
    if (!customerEmail || booking.customerEmail !== customerEmail) {
      return res.send({ message: "This booking does not belong to you" });
    }

    // amount, center and booking details come from the booking itself
    const refund = await RefundModel.create({
      bookingId: booking._id,
      centerId: booking.centerId,
      treatmentName: booking.treatmentName,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      amount: booking.price,
      bookingDate: booking.date,
      bookingTime: booking.time,
      reason: reason.trim(),
    });

    res.send({ message: "success", refund });
  } catch (error) {
    if (error.code === 11000) {
      return res.send({ message: "A refund request already exists for this booking" });
    }
    res.send({ message: "Refund Error: " + error.message });
  }
});

// Refund requests of one center
app.get("/refunds/center/:centerId", async (req, res) => {
  try {
    const refunds = await RefundModel.find({ centerId: req.params.centerId })
      .sort({ createdAt: -1 });
    res.send({ message: "success", refunds });
  } catch (error) {
    res.send({ message: "Get Refunds Error: " + error.message });
  }
});

// Refund requests of one customer
app.get("/refunds/customer/:email", async (req, res) => {
  try {
    const refunds = await RefundModel.find({ customerEmail: req.params.email })
      .sort({ createdAt: -1 });
    res.send({ message: "success", refunds });
  } catch (error) {
    res.send({ message: "Get Refunds Error: " + error.message });
  }
});

// Center approves or rejects a refund request
app.put("/refunds/:id/decision", async (req, res) => {
  try {
    const { approved } = req.body;

    const refund = await RefundModel.findById(req.params.id);
    if (!refund) return res.send({ message: "Refund request not found" });
    if (refund.status !== "pending") {
      return res.send({ message: "This request was already answered" });
    }

    refund.status = approved ? "approved" : "rejected";
    refund.decidedAt = new Date();
    await refund.save();

    // approved: the booking is cancelled, so the time slot becomes free again
    if (approved) {
      await BookingModel.findByIdAndDelete(refund.bookingId);
    }

    // notify the customer
    await NotificationModel.create({
      customerEmail: refund.customerEmail,
      type: "refund",
      text: approved
        ? `Your refund request for ${refund.treatmentName} (${refund.amount} OMR) was approved.`
        : `Your refund request for ${refund.treatmentName} (${refund.amount} OMR) was rejected.`,
    });

    res.send({ message: "success", refund });
  } catch (error) {
    res.send({ message: "Decision Error: " + error.message });
  }
});

// Notifications of one customer
app.get("/notifications/customer/:email", async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      customerEmail: req.params.email,
    }).sort({ createdAt: -1 });
    res.send({ message: "success", notifications });
  } catch (error) {
    res.send({ message: "Get Notifications Error: " + error.message });
  }
});

// Mark a notification as read
app.put("/notifications/:id/read", async (req, res) => {
  try {
    await NotificationModel.findByIdAndUpdate(req.params.id, { isRead: true });
    res.send({ message: "success" });
  } catch (error) {
    res.send({ message: "Read Error: " + error.message });
  }
});

// ================= Admin monthly stats =================

// Get monthly registered centers
app.get("/admin/centers/monthly", async (req, res) => {
  try {
    const centers = await CenterModel.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: [{ $type: "$createdAt" }, "date"] },
              { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              "Unknown Date"
            ]
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(centers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get monthly registered customers
app.get("/admin/customers/monthly", async (req, res) => {
  try {
    const customers = await UserModel.aggregate([
      { $match: { role: "customer" } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: [{ $type: "$createdAt" }, "date"] },
              {
                $dateToString: {
                  format: "%Y-%m",
                  date: "$createdAt"
                }
              },
              "Unknown Date"
            ]
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= Customer Profile =================

// View Customer Profile
app.get("/customer/profile/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await UserModel.findOne({
      _id: req.params.id,
      role: "customer",
    }).select("username email phone");

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "success", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

// Update Customer Profile
app.put("/customer/profile/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await UserModel.findOne({
      _id: req.params.id,
      role: "customer",
    });

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const { phone, currentPassword, newPassword } = req.body;

    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required",
        });
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "New password must be at least 8 characters",
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    user.phone = phone.trim();
    await user.save();

    res.json({
      message: "success",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ================= Customer: centers and treatments =================

// A CENTER record (managed by the admin) and the center's login account (USER)
// are linked by email, or by name for older records without an email.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function findCenterUser(center) {
  const fields = "username email phone image description locations";

  if (center.email && center.email.trim()) {
    const byEmail = await UserModel.findOne({
      role: "center",
      email: new RegExp(`^${escapeRegex(center.email.trim())}$`, "i"),
    }).select(fields);
    if (byEmail) return byEmail;
  }

  if (center.centerName && center.centerName.trim()) {
    return UserModel.findOne({
      role: "center",
      username: new RegExp(`^${escapeRegex(center.centerName.trim())}$`, "i"),
    }).select(fields);
  }

  return null;
}

// Merge the CENTER record with the profile the center edited (image, phone, locations...)
function mergeCenter(center, user) {
  const c = center.toObject();
  if (!user) return { ...c, locations: [] };

  const locations = (user.locations || []).map((l) => ({
    name: l.name,
    mapUrl: l.mapUrl,
  }));

  return {
    ...c,
    phone: user.phone || c.phone,
    image: user.image || c.image,
    description: user.description || "",
    locations,
    // text version for pages that show one line
    location: locations.length ? locations.map((l) => l.name).join(", ") : c.location,
  };
}

// Get registered centers for customers
app.get("/customer/centers", async (req, res) => {
  try {
    const centers = await CenterModel.find({});

    const result = await Promise.all(
      centers.map(async (c) => mergeCenter(c, await findCenterUser(c)))
    );

    res.json({ message: "success", centers: result });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load centers",
    });
  }
});


// Get treatments for a selected center (only treatments that can be booked)
app.get("/customer/centers/:centerId/treatments", async (req, res) => {
  try {
    const { centerId } = req.params;

    if (!mongoose.isValidObjectId(centerId)) {
      return res.status(400).json({ message: "Invalid center ID" });
    }

    const center = await CenterModel.findById(centerId);

    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    const user = await findCenterUser(center);

    // treatments are saved with the center's USER _id
    const treatments = user
      ? await TreatmentModel.find({
          centerId: user._id,
          "slots.0": { $exists: true },
        }).sort({ createdAt: -1 })
      : [];

    res.json({
      message: "success",
      center: mergeCenter(center, user),
      treatments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load center treatments",
    });
  }
});



app.listen(3002, () => {
  console.log("Server Connected...");
});