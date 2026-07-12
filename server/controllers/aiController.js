const User = require('../models/User');
const { parseResume } = require('../utils/resumeParser');
const { generateJSON } = require('../utils/geminiService');

// Utility to get candidate's current skills
const getCandidateSkills = (user) => {
  let skills = [];
  if (user.parsedResumeData && user.parsedResumeData.skills && user.parsedResumeData.skills.length > 0) {
    skills = user.parsedResumeData.skills;
  } else if (user.skills && user.skills.length > 0) {
    skills = user.skills;
  } else {
    // Default fallback skills if none found
    skills = ['HTML', 'CSS', 'JavaScript', 'React'];
  }
  return skills;
};

// @desc    Analyze Candidate Resume using Gemini
// @route   POST /api/ai/analyze-resume
// @access  Private (Candidate only)
const analyzeResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let skills = [];
    
    if (req.file) {
      // If a new file is uploaded, parse it using the existing parser
      try {
        const parsed = await parseResume(req.file.path);
        if (parsed) {
          user.resumeUrl = `/uploads/resumes/${req.file.filename}`;
          user.parsedResumeData = {
            name: parsed.name || user.fullName,
            skills: parsed.skills || [],
            experience: parsed.experience || 'Fresher',
            education: parsed.education || 'Not specified'
          };
          // Sync user main skills if they are empty
          if (!user.skills || user.skills.length === 0) {
            user.skills = parsed.skills || [];
          }
          await user.save();
          skills = parsed.skills || [];
        }
      } catch (parseErr) {
        console.error('Error parsing uploaded resume in AI controller:', parseErr.message);
        return res.status(400).json({
          success: false,
          message: 'Failed to parse resume file. Ensure it is a valid PDF.'
        });
      }
    } else {
      // Use existing profile resume data
      skills = getCandidateSkills(user);
    }

    const targetRole = req.body.targetRole || 'Full Stack Developer';

    const prompt = `
      You are an expert ATS (Applicant Tracking System) parser and technical hiring consultant.
      Evaluate the candidate's resume/profile details below against the target role: "${targetRole}".
      
      Candidate Profile:
      - Full Name: ${user.fullName}
      - Experience: ${user.experience || 'Fresher'}
      - Education: ${user.education || 'Not specified'}
      - Extracted Skills: ${JSON.stringify(skills)}
      
      Provide a constructive evaluation of their profile. You must respond with JSON-only in the following format:
      {
        "extractedSkills": ["React", "JavaScript", ...],
        "missingSkills": ["TypeScript", "Docker", ...],
        "strengths": [
          "Detailed, specific strength 1...",
          "Detailed, specific strength 2..."
        ],
        "areasForImprovement": [
          "Specific actionable area for improvement 1...",
          "Specific actionable area for improvement 2..."
        ],
        "resumeScore": 75,
        "targetRole": "${targetRole}"
      }
      
      Note: The resumeScore must be an integer between 0 and 100 representing how well the skills align with the target role.
    `;

    const fallback = {
      extractedSkills: skills,
      missingSkills: ['TypeScript', 'Docker', 'Jest'],
      strengths: ['Foundational frontend tools listing', 'Structured profile details'],
      areasForImprovement: ['Incorporate cloud hosting expertise', 'Add unit testing skills'],
      resumeScore: 70,
      targetRole
    };

    const analysisResult = await generateJSON(prompt, fallback);

    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: analysisResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI Career Roadmap using Gemini
// @route   POST /api/ai/career-roadmap
// @access  Private (Candidate only)
const getCareerRoadmap = async (req, res, next) => {
  try {
    const { targetRole, currentSkillLevel, preferredLanguage } = req.body;
    
    if (!targetRole || !currentSkillLevel || !preferredLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide target role, skill level, and preferred language'
      });
    }

    const user = await User.findById(req.user._id);
    const skills = getCandidateSkills(user);

    const prompt = `
      You are an elite career mentor. Create a personalized learning roadmap for a user transitioning to "${targetRole}".
      
      User Context:
      - Current Skill Level: ${currentSkillLevel}
      - Preferred Programming Language: ${preferredLanguage}
      - Existing Skills: ${JSON.stringify(skills)}
      - Existing Experience: ${user.experience || 'None'}
      
      Design a custom learning timeline divided into 3 sequential steps (learningOrder), suggest 2 relevant projects (suggestedProjects), and outline key interview milestones (interviewPrepSteps).
      Your response must be JSON-only in the following format:
      {
        "role": "${targetRole}",
        "skillLevel": "${currentSkillLevel}",
        "language": "${preferredLanguage}",
        "learningOrder": [
          {
            "step": 1,
            "title": "Step 1 Title",
            "skills": ["Skill A", "Skill B", ...],
            "description": "Focus description...",
            "timeline": "Weeks 1-3"
          },
          {
            "step": 2,
            "title": "Step 2 Title",
            "skills": ["Skill C", "Skill D", ...],
            "description": "Focus description...",
            "timeline": "Weeks 4-7"
          },
          {
            "step": 3,
            "title": "Step 3 Title",
            "skills": ["Skill E", "Skill F", ...],
            "description": "Focus description...",
            "timeline": "Weeks 8-12"
          }
        ],
        "suggestedProjects": [
          {
            "title": "Capstone Project 1",
            "description": "What to build, tech stack to use, and core features.",
            "complexity": "Medium"
          },
          {
            "title": "Capstone Project 2",
            "description": "What to build, tech stack to use, and core features.",
            "complexity": "Hard"
          }
        ],
        "interviewPrepSteps": [
          "Preparation milestone 1...",
          "Preparation milestone 2..."
        ]
      }
    `;

    const fallback = {
      role: targetRole,
      skillLevel: currentSkillLevel,
      language: preferredLanguage,
      learningOrder: [
        { step: 1, title: 'Basics & Syntax', skills: [preferredLanguage], description: 'Get comfortable with language constructs.', timeline: 'Weeks 1-3' }
      ],
      suggestedProjects: [
        { title: 'Interactive Dashboard', description: 'Design full dashboard showing mock data.', complexity: 'Medium' }
      ],
      interviewPrepSteps: ['Practice DSA questions on LeetCode.']
    };

    const roadmapResult = await generateJSON(prompt, fallback);

    res.status(200).json({
      success: true,
      data: roadmapResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Interview Questions using Gemini
// @route   POST /api/ai/interview-prep
// @access  Private (Candidate only)
const getInterviewQuestions = async (req, res, next) => {
  try {
    const { interviewType } = req.body;
    
    if (!interviewType) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the interview type (hr, technical, resume)'
      });
    }

    const user = await User.findById(req.user._id);
    const skills = getCandidateSkills(user);

    const prompt = `
      You are a senior tech recruiter and interviewer.
      Generate exactly 10 interview questions of type: "${interviewType}" for a candidate.
      
      Candidate Context:
      - Skills: ${JSON.stringify(skills)}
      - Experience: ${user.experience || 'Fresher'}
      - Education: ${user.education || 'Not specified'}

      Guidelines:
      - If type is 'hr': Focus on behavioral, teamwork, problem-solving, and career motivations. Provide a professional template answer for each.
      - If type is 'technical': Focus on key concepts in MERN, database optimization, JavaScript event loop, and systems architecture. Provide a complete, correct technical answer.
      - If type is 'resume': Tailor questions directly to their skills: ${JSON.stringify(skills)}. Ask about specific challenges, trade-offs, and implementation strategies with those tools.

      Your response must be JSON-only in the following format (an array of exactly 10 question objects):
      [
        {
          "q": "Question text here?",
          "a": "Detailed, correct sample response guide."
        },
        ...
      ]
    `;

    const fallback = [
      { q: "Tell me about yourself.", a: "Prepare present, past, future story." },
      { q: "Explain your experience with React.", a: "Talk about components and state management." }
    ];

    const questionsResult = await generateJSON(prompt, fallback);

    res.status(200).json({
      success: true,
      data: questionsResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Dynamic MCQs Quiz using Gemini
// @route   POST /api/ai/generate-quiz
// @access  Private (Candidate only)
const generateQuiz = async (req, res, next) => {
  try {
    const { topic, difficulty, numQuestions } = req.body;
    
    if (!topic || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide topic and difficulty'
      });
    }

    const count = parseInt(numQuestions) || 5;

    const prompt = `
      You are a technical quiz creator.
      Generate exactly ${count} multiple-choice questions on the topic "${topic}" with a difficulty level of "${difficulty}".
      
      Requirements:
      - Each question must have exactly 4 options.
      - Specify the correctAnswer as a 0-indexed number (0, 1, 2, or 3).
      - Include a clear explanation of why the correct option is selected.
      
      Your response must be JSON-only in the following format (an array of exactly ${count} objects):
      [
        {
          "question": "Question text here?",
          "options": [
            "Option 0 text",
            "Option 1 text",
            "Option 2 text",
            "Option 3 text"
          ],
          "correctAnswer": 1,
          "explanation": "Clear explanation of correct answer."
        },
        ...
      ]
    `;

    const fallback = [
      {
        question: "Which of the following is NOT a JavaScript data type?",
        options: ["String", "Boolean", "Float", "Undefined"],
        correctAnswer: 2,
        explanation: "JavaScript uses the 'Number' type for float and integer representations."
      }
    ];

    const quizResult = await generateJSON(prompt, fallback);

    res.status(200).json({
      success: true,
      data: quizResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Skill Recommendations using Gemini
// @route   GET /api/ai/recommendations
// @access  Private (Candidate only)
const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const skills = getCandidateSkills(user);
    
    const prompt = `
      You are an expert career guidance counselor. Give personalized career preparation recommendations based on the candidate's profile.
      
      Profile Context:
      - Current Skills: ${JSON.stringify(skills)}
      - Experience: ${user.experience || 'None'}

      Generate a JSON-only response matching this exact structure:
      {
        "skillsToImprove": [
          {
            "skill": "React",
            "focusArea": "Learn custom hook reuse and rendering optimizations...",
            "platforms": ["LeetCode", "Frontend Mentor"]
          }
        ],
        "technologiesToLearnNext": [
          {
            "name": "TypeScript",
            "reason": "TypeScript is preferred for complex fullstack apps."
          }
        ],
        "certifications": [
          {
            "name": "AWS Certified Developer",
            "platform": "Amazon Web Services",
            "duration": "4-6 weeks"
          }
        ],
        "practicePlatforms": ["LeetCode", "HackerRank"],
        "estimatedPrepTime": "4-6 Weeks"
      }
    `;

    const fallback = {
      skillsToImprove: [
        { skill: 'React', focusArea: 'Learn lifecycle optimizations.', platforms: ['Frontend Mentor'] }
      ],
      technologiesToLearnNext: [
        { name: 'TypeScript', reason: 'Widely used in React apps.' }
      ],
      certifications: [
        { name: 'AWS Cloud Practitioner', platform: 'AWS', duration: '3 weeks' }
      ],
      practicePlatforms: ['LeetCode'],
      estimatedPrepTime: '4 Weeks'
    };

    const recResult = await generateJSON(prompt, fallback);

    res.status(200).json({
      success: true,
      data: recResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Prep Dashboard Stats using Gemini
// @route   GET /api/ai/dashboard
// @access  Private (Candidate only)
const getDashboardStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const skills = getCandidateSkills(user);

    // Baseline score calculation
    const baseScore = 60;
    const skillsBonus = Math.min(skills.length * 4, 30);
    const resumeScore = Math.min(baseScore + skillsBonus, 95);

    // Progress calculation
    const learnedCount = skills.length;
    const totalTargetCount = 12;
    const preparationProgress = Math.min(Math.round((learnedCount / totalTargetCount) * 100), 100);

    // Ask Gemini for a brief personalized next step recommendation
    const prompt = `
      Review this candidate's technical skills list: ${JSON.stringify(skills)}.
      Provide a single, specific, highly actionable next step they should take to improve their job-readiness.
      Be extremely brief (1 short sentence, max 15 words).
      Return JSON only:
      {
        "recommendedNextStep": "Recommendation here"
      }
    `;

    const fallback = {
      recommendedNextStep: 'Learn TypeScript and take the React Hooks practice quiz.'
    };

    const stepResult = await generateJSON(prompt, fallback);

    res.status(200).json({
      success: true,
      data: {
        resumeScore,
        quizScore: 82, // Standard baseline quiz average
        skillsLearned: learnedCount,
        recommendedNextStep: stepResult.recommendedNextStep || fallback.recommendedNextStep,
        preparationProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResume,
  getCareerRoadmap,
  getInterviewQuestions,
  generateQuiz,
  getRecommendations,
  getDashboardStats
};
