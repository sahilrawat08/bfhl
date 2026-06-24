require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { processHierarchy } = require('./utils/graph');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (mandatory for cross-origin evaluation)
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Serve static assets from the React client "dist" folder
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// API Endpoint: POST /bfhl
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        is_success: false,
        error: "Missing required parameter 'data' in request body."
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        is_success: false,
        error: "Parameter 'data' must be an array of strings."
      });
    }

    // Process graph logic
    const processed = processHierarchy(data);

    // Identity credentials from environment variables
    const fullName = process.env.USER_FULLNAME || "sahil_rawat";
    const birthDate = process.env.USER_BIRTHDATE || "12042003";
    const emailId = process.env.USER_EMAIL || "sahil.rawat@college.edu";
    const rollNumber = process.env.USER_ROLL_NUMBER || "22CS1001";

    const response = {
      user_id: `${fullName.toLowerCase().replace(/\s+/g, '_')}_${birthDate}`,
      email_id: emailId,
      college_roll_number: rollNumber,
      ...processed
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Server processing error:', error);
    return res.status(500).json({
      is_success: false,
      error: "An internal server error occurred while processing the graph."
    });
  }
});

// Root fallback to serve index.html (useful for simple hosting deployments)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 API Endpoint: http://localhost:${PORT}/bfhl`);
  console.log(`👉 Frontend Home: http://localhost:${PORT}`);
});
