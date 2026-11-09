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
const SERVER_URL = "http://localhost:3002";

app.use(cors());
// images chosen from the device are saved as text, so the request body can be bigger
app.use(express.json({ limit: "2mb" }));

//added to make database work
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const conStr =
  "mongodb+srv://admin:admin123@hct-cluster.czj4w6k.mongodb.net/HCSDB?retryWrites=true&w=majority&appName=HCT-Cluster";

mongoose
  .connect(conStr)
  .then(() => console.log("Database Connected..."))
  .catch((error) => console.log("Database Error: " + error));

// An image is either empty, a web link, or a small picture saved as text (data URL)
const MAX_IMAGE_CHARS = 700000;

function checkImage(image) {
  if (image === undefined || image === null || image === "") return null;
  if (typeof image !== "string") return "Invalid image";
  if (image.length > MAX_IMAGE_CHARS) return "Image is too large";
  if (/^https?:\/\//i.test(image)) return null;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) return null;
  return "Invalid image";
}

const UserSchema = new mongoose.Schema({
  username: String,
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CENTER",
  },
  email: String,
  phone: String,
  password: String,

  role: {
    type: String,
    default: "customer",
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  emailVerificationToken: String,
  emailVerificationExpiry: Date,

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
    crNumber: { type: String, required: true },
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
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = new UserModel({
      username,
      email,
      phone,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    await newUser.save();
    const confirmUrl = `${SERVER_URL}/verify-email?token=${verificationToken}&action=yes`;
    const rejectUrl = `${SERVER_URL}/verify-email?token=${verificationToken}&action=no`;

    // Send Welcome Email
    try {
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
        subject: "HCS - Confirm Your Registration",
        html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
      <h2 style="color: #4F8577;">Welcome to Holistic Centers (HCS)!</h2>

      <p>Hello ${username},</p>
      <p>Your registration request has been received.</p>
      <p>Do you want to confirm your registration?</p>

      <a href="${confirmUrl}"
         style="display: inline-block; background: #4F8577; color: white;
                padding: 12px 28px; text-decoration: none;
                border-radius: 8px; margin: 10px;">
        Yes, Confirm
      </a>

      <a href="${rejectUrl}"
         style="display: inline-block; background: #C75B52; color: white;
                padding: 12px 28px; text-decoration: none;
                border-radius: 8px; margin: 10px;">
        No, Reject
      </a>

      <p style="color: #777; font-size: 12px;">
        These links expire in 24 hours.
      </p>

      <p>Best regards,<br>HCS Support Team</p>
    </div>
  `,
      });

    } catch (emailError) {
      console.error("Welcome Email Error:", emailError);

      await UserModel.deleteOne({
        _id: newUser._id,
        isEmailVerified: false,
      });

      return res.status(500).send({
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.send({ message: "User Registered" });
  } catch (error) {
    res.send({ message: "Register Error: " + error });
  }
});

// Email Verification API
app.get("/verify-email", async (req, res) => {
  try {
    const { token, action } = req.query;

    if (!token || !["yes", "no"].includes(action)) {
      return res.status(400).send("Invalid verification link.");
    }

    const user = await UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
      isEmailVerified: false,
    });

    if (!user) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    if (action === "yes") {
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpiry = undefined;

      await user.save();

      return res.send("Email confirmed successfully! You can now log in.");
    }

    if (action === "no") {

      if (user.role === "center") {
        await CenterModel.deleteOne({
          email: user.email
        });
      }

      await UserModel.deleteOne({
        _id: user._id
      });

      return res.send("Registration rejected successfully.");
    }

  } catch (error) {
    console.error("Email Verification Error:", error);
    res.status(500).send("Email verification failed.");
  }
});


// Register Center API
app.post("/register-center", async (req, res) => {
  try {
    const { username, email, phone, crNumber, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (user) {
      return res.send({ message: "Center Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newCenter = new UserModel({
      username,
      email,
      phone,
      password: hashedPassword,
      role: "center",
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    await newCenter.save();
    const confirmUrl = `${SERVER_URL}/verify-email?token=${verificationToken}&action=yes`;
    const rejectUrl = `${SERVER_URL}/verify-email?token=${verificationToken}&action=no`;

    const centerRecord = await CenterModel.create({
      centerName: username,
      email,
      phone,
      crNumber,
      image: "",
      isActive: "true",
      location: "",
    });

    newCenter.centerId = centerRecord._id;
    await newCenter.save();

    // Send Welcome Email to Center
    try {
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
        subject: "HCS - Confirm Your Center Registration",
        html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
      <h2 style="color: #4F8577;">
        Welcome to Holistic Centers (HCS)!
      </h2>

      <p>Hello ${username.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")},</p>

      <p>Your center registration request has been received.</p>
      <p>Please confirm your email to activate your center account.</p>

      <a href="${confirmUrl}"
         style="display: inline-block; background: #4F8577;
                color: white; padding: 12px 28px;
                text-decoration: none; border-radius: 8px;
                margin: 10px;">
        Yes, Confirm
      </a>

      <a href="${rejectUrl}"
         style="display: inline-block; background: #C75B52;
                color: white; padding: 12px 28px;
                text-decoration: none; border-radius: 8px;
                margin: 10px;">
        No, Reject
      </a>

      <p style="color: #777; font-size: 12px;">
        These links expire in 24 hours.
      </p>

      <p>Best regards, HCS Support Team</p>
    </div>
  `,
      });

    } catch (emailError) {
      console.error("Center Welcome Email Error:", emailError);

      await CenterModel.deleteOne({
        email: newCenter.email,
      });

      await UserModel.deleteOne({
        _id: newCenter._id,
        isEmailVerified: false,
      });

      return res.status(500).send({
        message: "Failed to send verification email. Please try again.",
      });
    }

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

    // Check Email Verification for center and user
    if (["customer", "center"].includes(user.role?.toLowerCase()) && user.isEmailVerified === false) {
      return res.send({
        message: "Please confirm your email before logging in.",
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

      if (user.role === "center" && user.isBlocked === true) {
        return res.send({
          message: "Your account is blocked.",
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
      subject: "HCS - Reset Password",
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
      <h2 style="color: #4F8577;">Reset Your Password</h2>
      <p>We received a request to reset your password.</p>
      <p>Your verification code is:</p>
      <h1 style="color: #4F8577;">${code}</h1>
      <p>This code expires in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,<br>HCS Support Team</p>
    </div>
  `,
    });

    res.send({ message: "Reset code sent successfully" });

  } catch (error) {
    res.send({ message: "Email Error: " + error.message });
  }
});

// Request to Join API
app.post("/request-to-join", async (req, res) => {
  try {
    const { centerName, centerEmail, phoneNumber, crNumber } = req.body;

    if (!centerName || !centerEmail || !phoneNumber || !crNumber) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "holisticcentersupport@gmail.com",
      replyTo: centerEmail,
      subject: "New Center Registration Request - HCS",
      text: `
New Request to Join

Center Name: ${centerName}
Center Email: ${centerEmail}
Phone Number: ${phoneNumber}
CR Number: ${crNumber}
      `,
    });

    res.json({
      message: "Request sent successfully"
    });

  } catch (error) {
    console.error("Request to Join Error:", error);
    res.status(500).json({
      message: "Failed to send request"
    });
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

// Get center data (without password) + the CR number the admin registered
app.get("/center/:id", async (req, res) => {
  try {
    const center = await UserModel.findOne({
      _id: req.params.id,
      role: "center",
    }).select("-password -resetCode -resetCodeExpiry");

    if (!center) return res.send({ message: "Center not found" });

    res.send({ message: "success", center: await centerProfileData(center) });
  } catch (error) {
    res.send({ message: "Get Center Error: " + error.message });
  }
});

// ================= Center profile update =================
// A phone number: 8 digits, numbers only, starts with 9 or 7
const PHONE_RE = /^[79]\d{7}$/;

// The CENTER record (the one the admin and the customers read) of a center account
async function findCenterRecord(user) {
  if (user.email && user.email.trim()) {
    const byEmail = await CenterModel.findOne({
      email: new RegExp(`^${escapeRegex(user.email.trim())}$`, "i"),
    });
    if (byEmail) return byEmail;
  }

  if (user.username && user.username.trim()) {
    return CenterModel.findOne({
      centerName: new RegExp(`^${escapeRegex(user.username.trim())}$`, "i"),
    });
  }

  return null;
}

// Keeps the CENTER record in step with the account profile (phone, image, locations)
async function syncCenterRecord(user) {
  const record = await findCenterRecord(user);
  if (!record) return;

  const set = {
    image: user.image || "",
    location: (user.locations || []).map((l) => l.name).join(", "),
  };
  if (user.phone) set.phone = user.phone;
  if (!record.email && user.email) set.email = user.email;

  // updateOne does not run the "required" check, so older records without a CR number still sync
  await CenterModel.updateOne({ _id: record._id }, { $set: set });
}


// Profile data of a center account + its CR number.
// The CR number is entered by the admin when the center is registered (CENTER record).
async function centerProfileData(user) {
  let record = user.centerId ? await CenterModel.findById(user.centerId) : null;
  if (!record) record = await findCenterRecord(user);

  return { ...user.toObject(), crNumber: record?.crNumber || "" };
}

// Only what the center sends is changed. Everything else stays exactly as it is saved.
app.put("/center/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.send({ message: "Center not found" });

    const center = await UserModel.findOne({ _id: req.params.id, role: "center" });
    if (!center) return res.send({ message: "Center not found" });

    const body = req.body || {};
    const updates = {};
    const renamed = []; // treatments that must follow a renamed location

    // phone: required, and checked only when it really changes
    if (body.phone !== undefined) {
      const phone = String(body.phone ?? "").trim();
      if (!phone) return res.send({ message: "Invalid phone number" });

      if (phone !== (center.phone || "")) {
        if (!PHONE_RE.test(phone)) return res.send({ message: "Invalid phone number" });
        updates.phone = phone;
      }
    }

    if (body.image !== undefined) {
      const imageErr = checkImage(body.image);
      if (imageErr) return res.send({ message: imageErr });
      updates.image = body.image || "";
    }

    if (body.description !== undefined) {
      updates.description = String(body.description ?? "");
    }

    if (body.locations !== undefined) {
      if (!Array.isArray(body.locations)) return res.send({ message: "Invalid locations" });

      const oldLocations = (center.locations || []).map((l) => ({
        id: String(l._id),
        name: l.name,
      }));

      const rows = [];
      const usedIds = new Set();

      for (const l of body.locations) {
        const name = String(l?.name ?? "").replace(/\s+/g, " ").trim();
        const mapUrl = String(l?.mapUrl ?? "").trim();

        if (!name && !mapUrl) continue; // empty row
        if (!name || !mapUrl) return res.send({ message: "Each location needs a name and a map link" });
        if (!/^https?:\/\//i.test(mapUrl)) {
          return res.send({ message: "Map link must start with http:// or https://" });
        }

        // a saved location keeps its id, so a rename can be followed in the treatments
        let old = oldLocations.find((o) => o.id === String(l?._id ?? ""));
        if (old && usedIds.has(old.id)) old = undefined;
        if (old) usedIds.add(old.id);

        rows.push({ old, name, mapUrl });
      }

      const seen = new Set();
      for (const r of rows) {
        const key = r.name.toLowerCase();
        if (seen.has(key)) return res.send({ message: "Location names must be different" });
        seen.add(key);
      }

      const finalNames = new Set(rows.map((r) => r.name));
      const renameMap = new Map();
      rows.forEach((r) => {
        if (r.old && r.old.name !== r.name) renameMap.set(r.old.name, r.name);
      });

      // treatments that use a location of this center
      const oldNames = new Set(oldLocations.map((o) => o.name));
      const treatments = await TreatmentModel.find({ centerId: center._id }).select("location");

      for (const tr of treatments) {
        if (!oldNames.has(tr.location)) continue; // an older treatment with free text is not touched

        const newName = renameMap.has(tr.location) ? renameMap.get(tr.location) : tr.location;
        if (!finalNames.has(newName)) {
          return res.send({
            message: "This location is used in a treatment. Change the treatment's location first.",
          });
        }
        if (newName !== tr.location) renamed.push({ id: tr._id, location: newName });
      }

      updates.locations = rows.map((r) =>
        r.old
          ? { _id: r.old.id, name: r.name, mapUrl: r.mapUrl }
          : { name: r.name, mapUrl: r.mapUrl }
      );
    }

    let saved = center;
    if (Object.keys(updates).length > 0) {
      saved = await UserModel.findByIdAndUpdate(center._id, { $set: updates }, { new: true });
    }

    if (renamed.length > 0) {
      await TreatmentModel.bulkWrite(
        renamed.map((r) => ({
          updateOne: { filter: { _id: r.id }, update: { $set: { location: r.location } } },
        }))
      );
    }

    // the admin and the customers read the CENTER record: keep it in step
    try {
      await syncCenterRecord(saved);
    } catch (syncError) {
      console.log("Center sync error:", syncError.message);
    }

    const result = await UserModel.findById(center._id).select("-password -resetCode -resetCodeExpiry");
    res.send({ message: "success", center: await centerProfileData(result) });
  } catch (error) {
    res.send({ message: "Update Center Error: " + error.message });
  }
});

// Get all centers from MongoDB
app.get("/admin/centers", async (req, res) => {
  try {
    const centers = await CenterModel.find({});

    const centersWithStatus = await Promise.all(
      centers.map(async (center) => {
        const user = await findCenterUser(center);

        return {
          ...center.toObject(),
          isBlocked: user?.isBlocked === true,
        };
      })
    );

    res.status(200).json(centersWithStatus);
  } catch (error) {
    console.error("Get Centers Error:", error);
    res.status(500).json({
      message: "Failed to fetch centers",
    });
  }
});


// Get monthly bookings per center
app.get("/admin/bookings/monthly", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required",
      });
    }

    const monthNumber = String(month).padStart(2, "0");
    const datePrefix = `${year}-${monthNumber}-`;

    const bookings = await BookingModel.find({
      date: { $regex: `^${datePrefix}` },
    });

    const centers = await CenterModel.find({});

    const result = await Promise.all(
      centers.map(async (center) => {
        const centerUser = await findCenterUser(center);

        const total = centerUser
          ? bookings.filter(
            (booking) =>
              booking.centerId.toString() === centerUser._id.toString()
          ).length
          : 0;

        return {
          centerId: center._id,
          centerName: center.centerName,
          total,
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error("Monthly Bookings Error:", error);
    res.status(500).json({
      message: "Failed to fetch monthly bookings",
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

// Block / Unblock Center
app.put("/admin/centers/:id/block", async (req, res) => {
  try {
    const center = await CenterModel.findById(req.params.id);

    if (!center) {
      return res.status(404).json({
        message: "Center not found",
      });
    }

    const user = await findCenterUser(center);

    if (!user) {
      return res.status(404).json({
        message: "Center account not found",
      });
    }

    const newStatus = user.isBlocked !== true;

    await UserModel.updateOne(
      { _id: user._id, role: "center" },
      { $set: { isBlocked: newStatus } }
    );

    res.json({
      message: "success",
      isBlocked: newStatus,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update center status",
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

// Mark Admin Messages as Read by Customer
app.put("/messages/read-admin/:customerId", async (req, res) => {
  try {
    await MessageModel.updateMany(
      {
        customerId: req.params.customerId,
        sender: "admin",
        isRead: { $ne: true },
      },
      { $set: { isRead: true } }
    );

    res.send({ message: "success" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// ================= Doctor =================
const DoctorSchema = new mongoose.Schema(
  {
    // centerId = the _id of the center's login account in the USER collection
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true }, // lower case name, blocks duplicates
    specialty: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// the same doctor name cannot be registered twice in one center
DoctorSchema.index({ centerId: 1, nameKey: 1 }, { unique: true });

const DoctorModel = mongoose.model("DOCTOR", DoctorSchema, "DOCTOR");

// Add a doctor to a center (name and specialty are both required)
app.post("/doctors", async (req, res) => {
  try {
    const { centerId, name, specialty } = req.body;

    if (!mongoose.isValidObjectId(centerId)) return res.send({ message: "Invalid center" });

    const cleanName = (name || "").replace(/\s+/g, " ").trim();
    if (!cleanName) return res.send({ message: "Doctor name is required" });

    const cleanSpecialty = (specialty || "").replace(/\s+/g, " ").trim();
    if (cleanSpecialty.length < 2) return res.send({ message: "Specialty is required" });

    const center = await UserModel.findOne({ _id: centerId, role: "center" });
    if (!center) return res.send({ message: "Center not found" });

    const doctor = await DoctorModel.create({
      centerId,
      name: cleanName,
      nameKey: cleanName.toLowerCase(),
      specialty: cleanSpecialty,
    });

    res.send({ message: "success", doctor });
  } catch (error) {
    if (error.code === 11000) {
      return res.send({ message: "This doctor is already registered" });
    }
    res.send({ message: "Add Doctor Error: " + error.message });
  }
});

// Doctors of one center
app.get("/doctors/center/:centerId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.centerId)) {
      return res.send({ message: "Invalid center" });
    }
    const doctors = await DoctorModel.find({ centerId: req.params.centerId }).sort({ name: 1 });
    res.send({ message: "success", doctors });
  } catch (error) {
    res.send({ message: "Get Doctors Error: " + error.message });
  }
});

// Delete a doctor: /doctors/:id?centerId=...
app.delete("/doctors/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.send({ message: "Doctor not found" });

    const doctor = await DoctorModel.findById(req.params.id);
    if (!doctor) return res.send({ message: "Doctor not found" });

    if (!req.query.centerId || String(doctor.centerId) !== String(req.query.centerId)) {
      return res.send({ message: "Doctor not found" });
    }

    // a doctor used in a treatment schedule cannot be deleted
    const used = await TreatmentModel.exists({
      centerId: doctor.centerId,
      "slots.doctor": doctor.name,
    });
    if (used) return res.send({ message: "This doctor is used in a treatment schedule" });

    await DoctorModel.findByIdAndDelete(doctor._id);
    res.send({ message: "success" });
  } catch (error) {
    res.send({ message: "Delete Doctor Error: " + error.message });
  }
});

// ================= Treatment =================
const TreatmentSchema = new mongoose.Schema(
  {
    isMaster: { type: Boolean, default: false },
    masterTreatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TREATMENT",
      default: null,
    },
    name: { type: String, required: true },
    price: {
      type: Number,
      required: function () { return !this.isMaster; },
    },
    duration: {
      type: Number,
      required: function () { return !this.isMaster; },
    },
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
      required: function () { return !this.isMaster; },
    },
  },
  { timestamps: true }
);

const TreatmentModel = mongoose.model("TREATMENT", TreatmentSchema, "TREATMENT");
// Get Admin Treatment List
app.get("/admin/treatments", async (req, res) => {
  try {
    const treatments = await TreatmentModel.find({
      isMaster: true,
    }).sort({ name: 1 });

    res.send({ message: "success", treatments });
  } catch (error) {
    res.status(500).send({
      message: "Get Admin Treatments Error: " + error.message,
    });
  }
});


// Admin - Add Treatment
app.post("/admin/treatments", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();

    if (!name) {
      return res.send({ message: "Treatment name is required" });
    }

    const existing = await TreatmentModel.findOne({
      isMaster: true,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (existing) {
      return res.send({ message: "Treatment already exists" });
    }

    const treatment = await TreatmentModel.create({
      name,
      isMaster: true,
    });

    res.send({ message: "success", treatment });
  } catch (error) {
    res.status(500).send({
      message: "Add Treatment Error: " + error.message,
    });
  }
});

// Admin - Edit Treatment
app.put("/admin/treatments/:id", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();

    if (!name) {
      return res.send({ message: "Treatment name is required" });
    }

    const treatment = await TreatmentModel.findOne({
      _id: req.params.id,
      isMaster: true,
    });

    if (!treatment) {
      return res.send({ message: "Treatment not found" });
    }

    const existing = await TreatmentModel.findOne({
      isMaster: true,
      _id: { $ne: treatment._id },
      name: {
        $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existing) {
      return res.send({ message: "Treatment already exists" });
    }

    treatment.name = name;
    await treatment.save();

    await TreatmentModel.updateMany(
      {
        masterTreatmentId: treatment._id,
        isMaster: false,
      },
      {
        $set: { name: name },
      }
    );

    res.send({ message: "success", treatment });
  } catch (error) {
    res.status(500).send({
      message: "Edit Treatment Error: " + error.message,
    });
  }
});


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
const MIN_GAP = 5; // minutes between two slots of the same treatment

const toMin = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

function checkSlots(slots, duration) {
  if (!Array.isArray(slots) || slots.length === 0) {
    return "At least one time slot is required";
  }

  for (const s of slots) {
    if (!TIME_RE.test(s.start || "") || !TIME_RE.test(s.end || "")) {
      return "Invalid time format";
    }

    if (s.start >= s.end) {
      return "Slot end time must be after start time";
    }

    if (!s.doctor || !s.doctor.trim()) {
      return "Each slot needs a doctor name";
    }

    if (toMin(s.start) < 8 * 60 || toMin(s.end) > 22 * 60) {
      return "Appointments must start at or after 08:00 AM and finish by 10:00 PM";
    }
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

  // every slot is exactly as long as the treatment
  const dur = Number(duration);
  if (Number.isFinite(dur) && dur > 0) {
    for (const s of slots) {
      if (toMin(s.end) - toMin(s.start) !== dur) {
        return "Slot length must match the treatment duration";
      }
    }
  }

  // at least MIN_GAP minutes between any two slots of the treatment
  const sorted = [...slots].sort((a, b) => toMin(a.start) - toMin(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (toMin(sorted[i].start) - toMin(sorted[i - 1].end) < MIN_GAP) {
      return "Time slots must be at least 5 minutes apart";
    }
  }

  return null;
}

// every doctor in the slots must be registered in the same center
async function checkDoctors(centerId, slots) {
  if (!mongoose.isValidObjectId(centerId)) return "Invalid center";

  const doctors = await DoctorModel.find({ centerId }).select("name");
  const names = new Set(doctors.map((d) => d.name));

  for (const s of slots) {
    if (!names.has(s.doctor.trim())) return "Choose a doctor from your registered doctors";
  }
  return null;
}

// Every field of a treatment is required
function checkTreatmentFields(t) {
  const filled = (v) => typeof v === "string" && v.trim().length > 0;

  if (!filled(t.name)) return "Treatment name is required";

  const price = Number(t.price);
  if (!Number.isFinite(price) || price <= 0) return "A valid price is required";

  const duration = Number(t.duration);
  if (!Number.isInteger(duration) || duration <= 0) return "A valid duration is required";

  if (!filled(t.category)) return "Category is required";
  if (!filled(t.image)) return "Treatment image is required";
  if (!filled(t.location)) return "Location is required";
  if (!filled(t.description)) return "Description is required";

  if (
    !Array.isArray(t.workDays) ||
    t.workDays.length === 0 ||
    !t.workDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  ) {
    return "Select at least one working day";
  }

  return null;
}

// the location of a treatment must be one of the locations saved in the center's profile
async function checkTreatmentLocation(centerId, location) {
  if (!mongoose.isValidObjectId(centerId)) return "Invalid center";

  const center = await UserModel.findOne({ _id: centerId, role: "center" }).select("locations");
  const names = new Set((center?.locations || []).map((l) => l.name));

  if (!names.has(String(location ?? "").trim())) return "Choose a location from your saved locations";
  return null;
}

app.post("/treatments", async (req, res) => {
  try {
    const fieldErr = checkTreatmentFields(req.body);
    if (fieldErr) return res.send({ message: fieldErr });

    const locationErr = await checkTreatmentLocation(req.body.centerId, req.body.location);
    if (locationErr) return res.send({ message: locationErr });

    const imageErr = checkImage(req.body.image);
    if (imageErr) return res.send({ message: imageErr });

    const err = checkSlots(req.body.slots, req.body.duration);
    if (err) return res.send({ message: err });

    const doctorErr = await checkDoctors(req.body.centerId, req.body.slots);
    if (doctorErr) return res.send({ message: doctorErr });

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
    const existing = await TreatmentModel.findById(req.params.id);
    if (!existing) return res.send({ message: "Treatment not found" });

    // every field must still be filled after the update
    const fieldErr = checkTreatmentFields({ ...existing.toObject(), ...req.body });
    if (fieldErr) return res.send({ message: fieldErr });

    // a new location must be one of the center's saved locations
    if (req.body.location !== undefined && req.body.location !== existing.location) {
      const locationErr = await checkTreatmentLocation(existing.centerId, req.body.location);
      if (locationErr) return res.send({ message: locationErr });
    }

    if (req.body.image !== undefined) {
      const imageErr = checkImage(req.body.image);
      if (imageErr) return res.send({ message: imageErr });
    }

    // the schedule rules are checked whenever the slots or the duration change
    if (req.body.slots !== undefined || req.body.duration !== undefined) {
      const slots =
        req.body.slots !== undefined
          ? req.body.slots
          : existing.slots.map((s) => ({ start: s.start, end: s.end, doctor: s.doctor }));
      const duration = req.body.duration !== undefined ? req.body.duration : existing.duration;

      const err = checkSlots(slots, duration);
      if (err) return res.send({ message: err });

      if (req.body.slots !== undefined) {
        const doctorErr = await checkDoctors(existing.centerId, req.body.slots);
        if (doctorErr) return res.send({ message: doctorErr });
      }
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
  {
    unique: true,
    partialFilterExpression: {
      slotStart: { $type: "string" },
      status: "confirmed",
    },
  }
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

    const booked = await BookingModel.find({
      treatmentId: id,
      date,
      status: { $ne: "cancelled" },
    }).select("slotStart");
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


// Get all bookings of one customer (booking history)
app.get("/bookings/customer/:email", async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      customerEmail: req.params.email,
    }).sort({ date: -1 });

    const result = await Promise.all(
      bookings.map(async (booking) => {
        // Find the center login account using the booking centerId
        const centerUser = await UserModel.findOne({
          _id: booking.centerId,
          role: "center",
        }).select("username email centerId");

        let centerRecord = null;

        // First try the linked CENTER record ID
        if (centerUser?.centerId) {
          centerRecord = await CenterModel.findById(centerUser.centerId);
        }

        // Fallback: find the CENTER record using the account email
        if (!centerRecord && centerUser?.email) {
          centerRecord = await CenterModel.findOne({
            email: centerUser.email,
          });
        }

        // Fallback: find the CENTER record using the account username
        if (!centerRecord && centerUser?.username) {
          centerRecord = await CenterModel.findOne({
            centerName: centerUser.username,
          });
        }

        // Support older bookings that may store the CENTER record ID directly
        if (!centerUser) {
          centerRecord = await CenterModel.findById(booking.centerId);
        }

        return {
          ...booking.toObject(),
          centerName:
            centerRecord?.centerName ||
            centerUser?.username ||
            "Unknown Center",
        };
      })
    );

    res.send({
      message: "success",
      bookings: result,
    });
  } catch (error) {
    console.error("Get Customer Bookings Error:", error);
    res.status(500).send({
      message: "Get Bookings Error: " + error.message,
    });
  }
});


// Get all bookings of one customer (booking history)
app.get("/bookings/customer/:email", async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      customerEmail: req.params.email,
    })
      .sort({ date: -1 });
    res.send({ message: "success", bookings });
  } catch (error) {
    res.send({ message: "Get Bookings Error: " + error.message });
  }
});

// Customer Dashboard - Bookings by Center
app.get("/customer/dashboard-stats/:email", async (req, res) => {
  try {
    const bookings = await BookingModel.find({
      customerEmail: {
        $regex: `^${req.params.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    }).populate({
      path: "centerId",
      model: "USER",
      select: "username centerId",
      populate: {
        path: "centerId",
        model: "CENTER",
        select: "centerName",
      },
    });

    for (const booking of bookings) {
      const centerUser = booking.centerId;

      if (centerUser?.centerId) {
        const center = await CenterModel.findById(centerUser.centerId);

        booking.$locals.centerName = center?.centerName || centerUser.username;
      }
    }

    res.send({
      message: "success",
      bookings: bookings.map((booking) => ({
        ...booking.toObject(),
        centerName: booking.centerId?.centerId?.centerName || booking.centerId?.username || "Unknown Center",
      })),
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


// Center asks the customer for permission (edit or cancel)
// (the center pages no longer use this: permission is taken by phone outside the website)
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

// Center changes the booking date.
// The customer's permission is taken by phone (outside the website),
// so the server only checks that the booking belongs to the center that asks.
app.put("/bookings/:id/date", async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.send({ message: "Booking not found" });

    if (!req.body.centerId || String(booking.centerId) !== String(req.body.centerId)) {
      return res.send({ message: "This booking does not belong to your center" });
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

// Center cancels (deletes) a booking: /bookings/:id?centerId=...
// The customer's permission is taken by phone (outside the website).
app.delete("/bookings/:id", async (req, res) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) return res.send({ message: "Booking not found" });

    if (!req.query.centerId || String(booking.centerId) !== String(req.query.centerId)) {
      return res.send({ message: "This booking does not belong to your center" });
    }

    await BookingModel.findByIdAndDelete(req.params.id);
    res.send({ message: "success" });
  } catch (error) {
    res.send({ message: "Cancel Error: " + error.message });
  }
});


// ================= Feedback =================
const FeedbackSchema = new mongoose.Schema(
  {
    rate: { type: String, required: true },
    comment: { type: String, required: true },
    appId: String,

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOOKING",
    },
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
    },
    customerName: String,
    customerEmail: String,
    treatmentName: String,
  },
  { timestamps: true }
);

FeedbackSchema.index(
  { bookingId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      bookingId: { $type: "objectId" },
    },
  }
);

const FeedbackModel = mongoose.model(
  "FEEDBACK",
  FeedbackSchema,
  "FEEDBACK"
);



// Customer submits feedback
app.post("/feedback", async (req, res) => {
  try {
    const { bookingId, customerEmail, rating, comment } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Invalid booking" });
    }

    const rate = Number(rating);

    if (!Number.isInteger(rate) || rate < 1 || rate > 5) {
      return res.status(400).json({ message: "Choose a rating from 1 to 5" });
    }

    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!customerEmail || booking.customerEmail !== customerEmail) {
      return res.status(403).json({
        message: "This booking does not belong to you",
      });
    }

    const existingFeedback = await FeedbackModel.findOne({
      bookingId: booking._id,
    });

    if (existingFeedback) {
      return res.status(409).json({
        message: "already done reviewe",
      });
    }

    const feedback = await FeedbackModel.create({
      bookingId: booking._id,
      centerId: booking.centerId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      treatmentName: booking.treatmentName,
      rate: String(rate),
      comment: comment.trim(),
    });

    res.status(201).json({ message: "success", feedback });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "already done reviewe",
      });
    }

    console.error("Feedback Error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});



// Get feedback for one center
app.get("/feedback/center/:centerId", async (req, res) => {
  try {
    const { centerId } = req.params;

    if (!mongoose.isValidObjectId(centerId)) {
      return res.status(400).json({
        message: "Invalid center ID",
      });
    }

    const feedbacks = await FeedbackModel.find({
      centerId,
    }).sort({ createdAt: -1 });

    res.json({
      message: "success",
      feedbacks,
    });
  } catch (error) {
    console.error("Get Feedback Error:", error);
    res.status(500).json({
      message: "Failed to load feedback",
    });
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
// Number of refund requests of a center that still wait for an answer (for the red circle)
app.get("/refunds/center/:centerId/pending-count", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.centerId)) {
      return res.send({ message: "success", count: 0 });
    }
    const count = await RefundModel.countDocuments({
      centerId: req.params.centerId,
      status: "pending",
    });
    res.send({ message: "success", count });
  } catch (error) {
    res.send({ message: "Count Error: " + error.message });
  }
});

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
      await BookingModel.findByIdAndUpdate(refund.bookingId, {
        status: "cancelled",
      });
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

// ================= Admin Profile =================

// Get Admin Profile
app.get("/admin/profile/:id", async (req, res) => {
  try {
    const admin = await UserModel.findOne({
      _id: req.params.id,
      role: "admin",
    }).select("username email");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "success", admin });
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin profile" });
  }
});

// Update Admin Password
app.put("/admin/profile/:id", async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const admin = await UserModel.findOne({
      _id: req.params.id,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: "success" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update admin password",
    });
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
  const fields = "username email phone image description locations isBlocked";

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
    email: user.email || c.email,
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

// Error handler: always answer with JSON (a request that is too big gets a clear message)
app.use((err, req, res, next) => {
  if (err && err.type === "entity.too.large") {
    return res.send({ message: "Image is too large" });
  }
  console.error(err);
  res.status(500).send({ message: "Server Error" });
});

app.listen(3002, () => {
  console.log("Server Connected...");
});
