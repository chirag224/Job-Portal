
# Job Portal with Groq LLM API Integration

This project is a job listing and application portal with a chatbot interface powered by the Groq API, built using React, Node.js, MySQL, and Vite. The portal has both admin and candidate features and allows job searching, applying, and interacting with a chatbot to get job assistance.

## Features

### Candidate Features:
- **Job Search**: Search for jobs by location.
- **Job Listings**: View all available job listings with details like job title, description, location, salary, and contact information.
- **Job Application**: Apply for jobs by submitting your name and contact details.
- **Chatbot**: Interact with the Groq-powered chatbot for job suggestions, job details, and other assistance.

### Admin Features:
- **Job Management**: Add, edit, and delete job listings.
- **Search Jobs**: Search job listings by job ID.
- **Job Listing Form**: Admins can add new jobs or edit existing ones using a simple form.

### Chatbot:
- **Groq API Integration**: The chatbot uses the Groq API to provide responses to candidate queries and job suggestions.

## Technologies Used
- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Chatbot API**: Groq API (for job suggestions and assistance)


## Setup and Installation

### Prerequisites:
- Node.js installed
- MySQL installed and running

### Backend Setup:
1. Clone the repository.
2. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Create a `.env` file in the root of the backend directory with the following variables:
   ```plaintext
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=job_portal
   GROQ_API_KEY=your_groq_api_key
   ```
4. Run the backend server:
   ```bash
   npm start
   ```

### Frontend Setup:
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd Job-Portal-Frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
### Backend Server
The backend server is running on **port 3001**. It handles job listings, job applications, and communicates with the Groq API for chatbot interactions.

### Frontend (React with Vite)
The frontend is built with **React** and **Vite**, and it runs on **port 5173**. This provides a fast, modern UI for the job portal, including job listings, job applications, and the chatbot interface.

To run both the frontend and backend, make sure to start both servers:
- **Backend**: `localhost:3001`
- **Frontend**: `localhost:5173`

### MySQL Database:
1. Import the `schema.sql` to create the necessary tables:
   ```sql
   CREATE TABLE jobs (
     id INT AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT NOT NULL,
     location VARCHAR(255) NOT NULL,
     salary DECIMAL(10, 2),
     contact_email VARCHAR(255)
   );

   CREATE TABLE applications (
     id INT AUTO_INCREMENT PRIMARY KEY,
     job_id INT,
     candidate_name VARCHAR(255) NOT NULL,
     contact VARCHAR(255) NOT NULL,
     FOREIGN KEY (job_id) REFERENCES jobs(id)
   );
   ```

## Usage
- **Admin Panel**: Access the admin panel to manage job listings by visiting the backend's `/admin` endpoint.
- **Candidate Portal**: Candidates can browse available jobs, apply, and chat with the Groq-powered chatbot for help.

## API Endpoints

### Candidate API:
- `GET /api/candidate/jobs`: Fetch available jobs (supports filtering by location).
- `POST /api/candidate/apply`: Apply for a job with candidate details.

### Admin API:
- `GET /api/admin/jobs`: Get all job listings.
- `POST /api/admin/jobs`: Add a new job listing.
- `PUT /api/admin/jobs/:id`: Edit an existing job listing.
- `DELETE /api/admin/jobs/:id`: Delete a job listing.

### Chat API:
- `POST /api/chat`: Send a message to the Groq chatbot and receive a response.

## Notes
- The Groq chatbot API is used for job suggestions, answering queries, and providing job details.

## Contributing
Feel free to fork this repository, submit issues, or make pull requests to contribute improvements!

