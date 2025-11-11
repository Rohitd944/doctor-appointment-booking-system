// backend/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/userModel');

// ✅ Load env first
dotenv.config({ path: path.join(__dirname, '.env') });

const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalHistoryRoutes = require('./routes/medicalHistoryRoutes');

const app = express();
const PORT = process.env.PORT || 5001; // ✅ Render will auto-inject PORT

// ✅ --- CORS (must for Render) ---
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ --- Middleware ---
app.use(express.json());
app.use(morgan("dev"));

// ✅ --- Connect to MongoDB ---
connectDB();

// ✅ --- API Routes ---
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/history", medicalHistoryRoutes);

// ✅ --- Serve Frontend ---
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Catch-all → for React/SPAs or static frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ --- Database Seeder ---
const seedDatabase = async () => {
  try {
    const patientPassword = "DEFAULT_PASSWORD_NOT_SET";
    const staffDoctorPassword = "9096rohi";

    const users = [
      { name: "Admin Staff", email: "admin@clinic.com", role: "admin", specialty: "Administration", password: staffDoctorPassword },
      { name: "Dr. Vikas Gosavi", email: "v.gosavi@clinic.com", role: "doctor", specialty: "Oncologist (Siddhi Vinayak Hospital)", password: staffDoctorPassword },
      { name: "Dr. Shailesh Irali", email: "s.irali@clinic.com", role: "doctor", specialty: "ENT Specialist (Miraj ENT Hospital)", password: staffDoctorPassword },
      { name: "Dr. Rishikesh Kore", email: "r.kore@clinic.com", role: "doctor", specialty: "Urologist (Oasis Hospital)", password: staffDoctorPassword },
      { name: "Dr. Kunal Patil", email: "k.patil@clinic.com", role: "doctor", specialty: "Ophthalmologist (Akashdeep Netralay)", password: staffDoctorPassword },
      { name: "Dr. S G Prasadi", email: "sg.prasadi@clinic.com", role: "doctor", specialty: "General Surgeon (Manakapure Hospital)", password: staffDoctorPassword },
      { name: "Dr. Naim Shaikh", email: "n.shaikh@clinic.com", role: "doctor", specialty: "Heart Care (ICCU)", password: staffDoctorPassword },
      { name: "Dr. G S Kulkarni", email: "gs.kulkarni@clinic.com", role: "doctor", specialty: "General Physician (Kulkarni Hospital)", password: staffDoctorPassword },
      { name: "Test Patient", email: "patient@clinic.com", role: "patient", specialty: "N/A", password: patientPassword },
    ];

    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`✅ Seeded: ${userData.name}`);
      }
    }
  } catch (err) {
    console.error(`❌ Seeding error: ${err.message}`);
  }
};

// ✅ --- Start Server ---
app.listen(PORT, async () => {
  console.log(`✅ MongoDB Connected`);
  await seedDatabase(); // Seed after connect
  console.log(`✅ Server live on port ${PORT}`);
});
