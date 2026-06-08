const fs = require('fs');
const pdfParse = require('pdf-parse');

const parseResume = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parsedData = await pdfParse(dataBuffer);
    const text = parsedData.text;

    // 1. Extract Name (Heuristic: First few non-empty lines, looking for something that is 2-3 words)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let name = '';
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      // Basic check to see if the line looks like a name (only letters and spaces, 2 to 3 words)
      if (/^[a-zA-Z\s]{3,30}$/.test(line) && line.split(' ').length >= 2) {
        name = line;
        break;
      }
    }

    // 2. Extract Skills (Keyword matching from common technical dictionary)
    const skillsList = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'HTML', 'CSS', 'SQL',
      'React', 'Node.js', 'Angular', 'Vue.js', 'Express', 'Django', 'Flask', 'Spring Boot',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'Git', 'GitHub',
      'TypeScript', 'GraphQL', 'Redux', 'Tailwind', 'Bootstrap', 'Next.js', 'Linux', 'Machine Learning'
    ];
    const skills = [];
    skillsList.forEach(skill => {
      // Word boundary regex check for case-insensitive matching
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(text)) {
        skills.push(skill);
      }
    });

    // 3. Extract Experience Heuristic
    // Search for experience years patterns (e.g. "5 years", "2+ yrs", etc.)
    let experience = '';
    const expRegex = /(\d+)\+?\s*(years?|yrs?)\s*(of)?\s*experience/i;
    const match = text.match(expRegex);
    if (match) {
      experience = `${match[1]} Years`;
    } else {
      // Search for "Experience" section and extract the following line
      const expIndex = text.toLowerCase().indexOf('experience');
      if (expIndex !== -1) {
        const sub = text.substring(expIndex, expIndex + 200);
        const subLines = sub.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (subLines.length > 1) {
          experience = subLines[1].substring(0, 50); // limit to 50 chars
        }
      }
    }
    if (!experience) {
      experience = 'Fresher';
    }

    // 4. Extract Education Heuristic
    // Look for degrees like B.Tech, Bachelor, Master, PhD, BS, MS, etc.
    let education = '';
    const degrees = [
      'B.Tech', 'M.Tech', 'B.E.', 'M.E.', 'Bachelor of Technology', 'Bachelor of Engineering',
      'Bachelor of Science', 'Master of Science', 'B.Sc', 'M.Sc', 'BCA', 'MCA', 'MBA',
      'Bachelor', 'Master', 'PhD', 'B.S.', 'M.S.'
    ];
    for (const degree of degrees) {
      const reg = new RegExp(`\\b${degree.replace('.', '\\.')}\\b`, 'i');
      if (reg.test(text)) {
        education = degree;
        // Try to find the university/school name nearby (e.g., in the next 100 characters)
        const idx = text.toLowerCase().indexOf(degree.toLowerCase());
        const context = text.substring(idx, idx + 150);
        const uniRegex = /(university|college|institute|school)/i;
        if (uniRegex.test(context)) {
          const contextLines = context.split('\n').map(l => l.trim()).filter(Boolean);
          const uniLine = contextLines.find(l => uniRegex.test(l));
          if (uniLine) {
            education = `${degree} - ${uniLine}`;
          }
        }
        break;
      }
    }
    if (!education) {
      education = 'Not specified';
    }

    return {
      name: name || null,
      skills,
      experience,
      education
    };
  } catch (error) {
    console.error('Error parsing PDF resume:', error.message);
    return null;
  }
};

module.exports = { parseResume };
