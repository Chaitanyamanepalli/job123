require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

const sampleJobs = [
  {
    title: 'Frontend Developer',
    company: 'Google',
    location: 'Bangalore, India',
    salary: 1500000,
    salaryRange: '₹ 12 - 18 LPA',
    experience: '2-4 Yrs',
    logo: 'google',
    jobType: 'Full Time',
    description: `We are looking for a skilled Frontend Developer to join our team and build amazing user experiences. You will work on building responsive web applications using modern technologies.

Responsibilities:
• Build reusable components and front-end libraries for future use
• Translate designs and wireframes into high quality code
• Optimize components for maximum performance
• Collaborate with designers and backend developers

Requirements:
• Proven experience in HTML, CSS, JavaScript
• Experience in React.js or similar frameworks
• Good understanding of responsive design
• Knowledge of version control systems`
  },
  {
    title: 'UI/UX Designer',
    company: 'Microsoft',
    location: 'Hyderabad, India',
    salary: 1100000,
    salaryRange: '₹ 8 - 14 LPA',
    experience: '1-3 Yrs',
    logo: 'microsoft',
    jobType: 'Full Time',
    description: `Microsoft is looking for a creative UI/UX Designer to craft premium, interactive experiences for our cloud suite. You will collaborate with product managers, developers, and users to plan customer journeys and build high-fidelity interactive wireframes.

Responsibilities:
• Create wireframes, storyboards, user flows, and site maps
• Design clean, harmonized design systems and components
• Conduct user research and evaluate user feedback
• Establish and promote design guidelines, best practices, and standards

Requirements:
• Portfolio of professional design projects (web and mobile)
• Proficiency in Figma, Sketch, or Adobe Creative Suite
• Good communication skills and team collaboration principles`
  },
  {
    title: 'Backend Developer',
    company: 'Amazon',
    location: 'Pune, India',
    salary: 1200000,
    salaryRange: '₹ 9 - 15 LPA',
    experience: '3-5 Yrs',
    logo: 'amazon',
    jobType: 'Full Time',
    description: `Build scalable, high-performance web APIs and distributed systems at Amazon. You will design, develop, and test APIs, microservices, and queue pipelines.

Responsibilities:
• Design and deploy scalable, reliable Node.js/Express APIs
• Optimize database schemas and write efficient search queries
• Integrate third-party tools and monitor cloud infrastructure health
• Improve CI/CD delivery pipelines and testing coverage

Requirements:
• Experience with server environments (Node.js, Go, Python, or Java)
• Experience with SQL/NoSQL databases (MongoDB, PostgreSQL, Redis)
• Understanding of REST APIs and microservice architectures`
  },
  {
    title: 'Data Analyst',
    company: 'Deloitte',
    location: 'Remote',
    salary: 800000,
    salaryRange: '₹ 6 - 10 LPA',
    experience: '0-2 Yrs',
    logo: 'deloitte',
    jobType: 'Full Time',
    description: `Join Deloitte's analytical consultancy team. You will gather, clean, structure, and analyze big datasets to help clients make informed business decisions.

Responsibilities:
• Clean and transform raw data into reportable metrics
• Design interactive dashboards (PowerBI, Tableau) for stakeholders
• Write scripts to automate repetitive reporting structures
• Present analytical insights and findings to technical and business audiences

Requirements:
• Good knowledge of SQL and Python/R for data analysis
• Experience with data visualization tools (Tableau, PowerBI)
• Strong mathematical and statistical reasoning skills`
  }
];

const seedData = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal_pro');
    console.log('Connected to database for seeding...');

    // Clear existing data
    await Job.deleteMany({});
    await Application.deleteMany({});
    try {
      await User.collection.drop();
      console.log('Dropped users collection to clear stale indexes.');
    } catch (err) {
      await User.deleteMany({});
    }
    console.log('Cleared existing data.');

    // Seed candidate
    const candidateUser = await User.create({
      fullName: 'Rahul Kumar',
      email: 'rahul@gmail.com',
      password: 'password123',
      role: 'candidate',
    });

    // Seed recruiter
    const recruiterUser = await User.create({
      fullName: 'Recruiter Pro',
      email: 'recruiter@gmail.com',
      password: 'password123',
      role: 'recruiter',
    });

    console.log('Successfully seeded candidate and recruiter users.');

    // Attach recruiter owner to sample jobs
    const jobsWithRecruiter = sampleJobs.map(job => ({
      ...job,
      postedBy: recruiterUser._id
    }));

    // Insert Jobs
    const createdJobs = await Job.insertMany(jobsWithRecruiter);
    console.log(`Successfully seeded ${createdJobs.length} jobs.`);

    // Match exact application dates and statuses from My Applications mockup
    const sampleApplications = [
      {
        name: 'Rahul Kumar',
        email: 'rahul@gmail.com',
        phone: '+91 9876543210',
        jobId: createdJobs[0]._id, // Google (Frontend Developer)
        candidateId: candidateUser._id,
        appliedAt: new Date('2024-05-20T10:00:00Z'),
        status: 'Under Review'
      },
      {
        name: 'Rahul Kumar',
        email: 'rahul@gmail.com',
        phone: '+91 9876543210',
        jobId: createdJobs[1]._id, // Microsoft (UI/UX Designer)
        candidateId: candidateUser._id,
        appliedAt: new Date('2024-05-18T14:30:00Z'),
        status: 'Shortlisted'
      },
      {
        name: 'Rahul Kumar',
        email: 'rahul@gmail.com',
        phone: '+91 9876543210',
        jobId: createdJobs[2]._id, // Amazon (Backend Developer)
        candidateId: candidateUser._id,
        appliedAt: new Date('2024-05-15T09:15:00Z'),
        status: 'Rejected'
      },
      {
        name: 'Rahul Kumar',
        email: 'rahul@gmail.com',
        phone: '+91 9876543210',
        jobId: createdJobs[3]._id, // Deloitte (Data Analyst)
        candidateId: candidateUser._id,
        appliedAt: new Date('2024-05-10T16:45:00Z'),
        status: 'Under Review'
      }
    ];

    const createdApps = await Application.insertMany(sampleApplications);
    console.log(`Successfully seeded ${createdApps.length} applications for rahul@gmail.com.`);

    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

// Run seeding
seedData();
