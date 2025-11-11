// backend/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/userModel'); // Model ko yahaan load karein

// Load env first
dotenv.config({ path: path.join(__dirname, '.env') });

const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalHistoryRoutes = require('./routes/medicalHistoryRoutes');

const app = express();
const PORT = process.env.PORT || 5001; // Aapke .env ke hisab se 5001

// --- Database Seeder ---
const seedDatabase = async () => {
  try {
    // --- Define Passwords (PLAIN TEXT) ---
    // ✅ BUG FIXED: Passwords ko plain text mein rakhein.
    // userModel.js ka pre('save') hook unhe automatically hash karega.
    
    const patientPassword = 'DEFAULT_PASSWORD_NOT_SET';
    const staffDoctorPassword = '9096rohi'; // <-- Plain text password

    // --- Define Users ---
    const users = [
      // Staff/Admin account
      {
        name: 'Admin Staff',
        email: 'admin@clinic.com',
        role: 'admin',
        specialty: 'Administration',
        password: staffDoctorPassword // <-- Plain text
      },
      
      // Doctors
      {
        name: 'Dr. Vikas Gosavi',
        email: 'v.gosavi@clinic.com',
        role: 'doctor',
        specialty: 'Oncologist (Siddhi Vinayak Hospital)',
        password: '9096rohit' // <-- Plain text
      },
      {
        name: 'Dr. Shailesh Irali',
        email: 's.irali@clinic.com',
        role: 'doctor',
        specialty: 'ENT Specialist (Miraj ENT Hospital)',
        password: staffDoctorPassword // <-- Plain text
      },
      {
        name: 'Dr. Rishikesh Kore',
        email: 'r.kore@clinic.com',
        role: 'doctor',
        specialty: 'Urologist (Oasis Hospital)',
        password: staffDoctorPassword // <-- Plain text
      },
      {
        name: 'Dr. Kunal Patil',
        email: 'k.patil@clinic.com',
        role: 'doctor',
        specialty: 'Ophthalmologist (Akashdeep Netralay)',
        password: staffDoctorPassword // <-- Plain text
      },
      {
        name: 'Dr. S G Prasadi',
        email: 'sg.prasadi@clinic.com',
        specialty: 'General Surgeon (Manakapure Hospital)',
        role: 'doctor',
        password: staffDoctorPassword // <-- Plain text
      },
      {
        name: 'Dr. Naim Shaikh',
        email: 'n.shaikh@clinic.com',
        specialty: 'Heart Care (ICCU)',
        role: 'doctor',
        password: staffDoctorPassword // <-- Plain text
      },
      {
        name: 'Dr. G S Kulkarni',
        email: 'gs.kulkarni@clinic.com',
        specialty: 'General Physician (Kulkarni Hospital)',
        role: 'doctor',
        password: staffDoctorPassword // <-- Plain text
      },

      // Patient account
      {
        name: 'Test Patient',
        email: 'patient@clinic.com',
        role: 'patient',
        specialty: 'N/A',
        password: patientPassword // <-- Plain text
      }
    ];

    // --- Seeding Logic ---
    for (const userData of users) {
      const userExists = await User.findOne({ email: userData.email });
      if (!userExists) {
        // User.create() ab pre('save') hook ko trigger karega
        await User.create(userData);
        console.log(`✅ Seeded User: ${userData.name}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error seeding database: ${error.message}`);
  }
};

// --- Start Server Function ---
const startServer = async () => {
  try {
    await connectDB(); // ✅ DB connected

    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    app.use('/api/users', userRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/history', medicalHistoryRoutes);

    // Frontend serve
    const frontendPath = path.join(__dirname, '../frontend');
    app.use(express.static(frontendPath));
    app.get('*', (req, res) =>
      res.sendFile(path.join(frontendPath, 'index.html'))
    );
    
    // Database ko seed karein
    await seedDatabase(); 

    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error(`❌ Server start error: ${err.message}`);
    process.exit(1);
  }
};

startServer();
