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

  resetCode: String,
  resetCodeExpiry: Date,
}, { timestamps: true });

const UserModel = mongoose.model("USER", UserSchema, "USER");
const CenterSchema = new mongoose.Schema(
  {
    centerName: String,
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
      image: "",
      isActive: "true",
      location: "",
    });

    res.send({ message: "Center Registered" });
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

// Update center data (phone, image, description, location)
app.put("/center/:id", async (req, res) => {
  try {
    const { phone, image, description, location } = req.body;

    const center = await UserModel.findOneAndUpdate(
      { _id: req.params.id, role: "center" },
      { phone, image, description, location },
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
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: true,
    },
  },
  { timestamps: true }
);

const TreatmentModel = mongoose.model("TREATMENT", TreatmentSchema, "TREATMENT");

app.post("/treatments", async (req, res) => {
  try {
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

app.listen(3002, () => {
  console.log("Server Connected...");
});