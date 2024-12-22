const express = require('express');
const db = require('./db'); // Database connection module
const Groq = require('groq-sdk');
require('dotenv').config(); // For loading environment variables
const cors = require('cors');


const app = express();
app.use(cors());

// Use JSON middleware to parse incoming request bodies
app.use(express.json());

// Initialize Groq with the API key from environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Create jobs table for admin if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    contact_email VARCHAR(255) NOT NULL
  );
`, (err, result) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Jobs table is ready');
  }
});

// Create applications table for candidates if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );
`, (err, result) => {
  if (err) {
    console.error('Error creating applications table:', err);
  } else {
    console.log('Applications table is ready');
  }
});

/// GET route to fetch all jobs for the admin
app.get('/api/admin/jobs', (req, res) => {
  const query = 'SELECT * FROM jobs';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching jobs:', err);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    res.status(200).json(results);
  });
});

// POST route to add a new job
// POST route to add a new job
app.post('/api/admin/jobs', (req, res) => {
  const { title, description, location, salary, contact_email } = req.body;

  const query = 'INSERT INTO jobs (title, description, location, salary, contact_email) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [title, description, location, salary, contact_email], (err, results) => {
    if (err) {
      console.error('Error adding job:', err);
      return res.status(500).json({ error: 'Failed to add job' });
    }

    // Fetch the newly added job with its ID
    const newJobId = results.insertId; // This is the auto-generated ID
    const newJobQuery = 'SELECT * FROM jobs WHERE id = ?';

    db.query(newJobQuery, [newJobId], (err, jobResults) => {
      if (err) {
        console.error('Error fetching the newly added job:', err);
        return res.status(500).json({ error: 'Failed to fetch job' });
      }

      // Return the new job data (including ID)
      res.status(201).json(jobResults[0]); // Send back the complete job object
    });
  });
});

// PUT route to update a job
app.put('/api/admin/jobs/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, location, salary, contact_email } = req.body;

  const query = 'UPDATE jobs SET title = ?, description = ?, location = ?, salary = ?, contact_email = ? WHERE id = ?';

  db.query(query, [title, description, location, salary, contact_email, id], (err, results) => {
    if (err) {
      console.error('Error updating job:', err);
      return res.status(500).json({ error: 'Failed to update job' });
    }

    res.status(200).json({ message: 'Job updated successfully' });
  });
});

// DELETE route to delete a job
app.delete('/api/admin/jobs/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM jobs WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error deleting job:', err);
      return res.status(500).json({ error: 'Failed to delete job' });
    }

    res.status(200).json({ message: 'Job deleted successfully' });
  });
});


// Updated Route to search jobs based on the user's query (Candidate)
// Route to handle chat requests from candidates
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  try {
    // Send the candidate's message and job table structure to Groq for SQL query generation
    const groqResponse = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `I need an SQL query based on the job table structure provided. Here’s the jobs table schema:

            (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT NOT NULL,
              location VARCHAR(255) NOT NULL,
              salary DECIMAL(10, 2) NOT NULL,
              contact_email VARCHAR(255) NOT NULL
            );

            You will receive two types of prompts:
            1. A more general type like "I am looking for jobs in Mumbai" or "I am looking for jobs related to software developer."
            2. A more specific type like "Tell me details about job with job_id (any number)."

            Here’s the candidate’s message: "${message}"


            Also correct the potential wrong spellings of title or location or anything  as per your understanding of the prompt (the sql query is for the mySQL database) ,  so Make the sql query  accordingly.`
        }
      ],
      model: 'llama3-8b-8192', // Use the Llama3 model or similar
    });

    // Extract the generated SQL query
    const responseContent = groqResponse.choices[0].message.content.trim();
    const sqlQueryMatch = responseContent.match(/```(?:sql)?\n([\s\S]+?)\n```/);

    if (sqlQueryMatch) {
      const sqlQuery = sqlQueryMatch[1].trim(); // Extracted SQL query

      // Execute the SQL query in the backend (using MySQL)
      db.query(sqlQuery, (err, results) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          return res.status(500).json({ error: 'Error executing SQL query.' });
        }

        // Limit the results to the first 10 or 20 jobs to prevent token overload
        const limitedResults = results.slice(0, 20); // Limit to the first 20 results (adjust as needed)

        // Prepare a new prompt for Groq based on the limited query result
        const queryResult = JSON.stringify(limitedResults); // Convert query result to string

        // Send the limited query result to Groq for generating a human-like response
        groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: `Based on the query result and the request of user, please generate a  response. The response should be in proper format.The data returned is:

              ${queryResult} ${message}

              Please provide a detailed and natural response based on this data.If you think that this data is not related to the request of the user then give the answer as per your understanding. Limit the response to a summary of the results, and if there are more than 5 jobs, mention how to view more results.
              
              Note : The salary in query result is in rupees.`
            }
          ],
          model: 'llama3-8b-8192', // Use the Llama3 model or similar
        }).then(groqResponse => {
          const humanResponse = groqResponse.choices[0].message.content.trim();
          return res.status(200).json({
            message: 'Generated human-like response from Groq:',
            response: humanResponse,
          });
        }).catch((groqError) => {
          console.error('Error with Groq API:', groqError);
          res.status(500).json({ error: 'Error processing Groq API response.' });
        });
      });
    } else {
      return res.status(400).json({ error: 'No SQL query generated. Please check the response format.' });
    }
  } catch (error) {
    console.error('Error with Groq API:', error);
    return res.status(500).json({ error: 'Error processing your request with Groq API.' });
  }
});

// Route to get available job listings (Candidate)
app.get('/api/candidate/jobs', (req, res) => {
  const { page = 1, limit = 10, location = '' } = req.query;  // Default to page 1, limit 10, and empty location

  // Ensure page and limit are integers
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const limitValue = parseInt(limit);

  // Start building the query
  let query = 'SELECT * FROM jobs';

  // Add location filter if it's provided
  const queryParams = [limitValue, offset];
  
  if (location) {
    query += ' WHERE location LIKE ?';  // Add location filter
    queryParams.unshift(`%${location}%`);  // Add the location parameter to the query params
  }

  query += ' LIMIT ? OFFSET ?';

  // Execute the query
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching jobs:', err);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    res.status(200).json(results);
  });
});


// Route to apply for a job (Candidate)
app.post('/api/candidate/apply', (req, res) => {
  const { candidate_name, contact, job_id } = req.body;

  if (!candidate_name || !contact || !job_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Insert application into the database
  const query = `
    INSERT INTO applications (job_id, candidate_name, contact)
    VALUES (?, ?, ?)
  `;
  const values = [job_id, candidate_name, contact];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error applying for job:', err);
      return res.status(500).json({ error: 'Failed to apply for job' });
    }

    res.status(201).json({ message: 'Application submitted successfully' });
  });
});

// Start the Express server
app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
