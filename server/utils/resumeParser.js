const fs = require('fs');
const pdfParse = require('pdf-parse');

const parseText = async (dataBuffer) => {
  if (typeof pdfParse === 'function') {
    const result = await pdfParse(dataBuffer);
    return result.text;
  } else if (pdfParse && pdfParse.PDFParse) {
    const parser = new pdfParse.PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    return result.text;
  } else {
    throw new Error('Unsupported pdf-parse module format');
  }
};

const parseResume = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const text = await parseText(dataBuffer);

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
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'PostgreSQL',
      'Java', 'Python', 'C++', 'C', 'HTML', 'CSS', 'Bootstrap', 'Tailwind', 'Git', 'GitHub',
      'AWS', 'Docker', 'Kubernetes', 'REST API', 'C#', 'Ruby', 'PHP', 'SQL', 'Angular',
      'Vue.js', 'Django', 'Flask', 'Spring Boot', 'Redis', 'GraphQL', 'Redux', 'Next.js',
      'Linux', 'Machine Learning'
    ];
    const skills = [];
    skillsList.forEach(skill => {
      // Escape regex special characters (e.g. + in C++, . in Node.js)
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Apply word boundaries only if the search term starts or ends with a word character
      const startBoundary = /^\w/.test(skill) ? '\\b' : '';
      const endBoundary = /\w$/.test(skill) ? '\\b' : '';
      const regex = new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
      if (regex.test(text)) {
        skills.push(skill);
      }
    });

    // 3. Extract Experience Heuristic
    let experience = '';
    const expRegexes = [
      /(\d+)\+?\s*(years?|yrs?)\s*(of)?\s*experience/i,
      /(\d+)\+?\s*(years?|yrs?)\b/i,
      /worked\s+as\s+([^,\n\.]+)/i,
      /(internship|intern)\b/i
    ];

    for (const regex of expRegexes) {
      const match = text.match(regex);
      if (match) {
        if (regex.source.includes('worked')) {
          experience = `Worked as ${match[1].trim()}`;
        } else if (regex.source.includes('internship')) {
          experience = 'Internship';
        } else {
          experience = `${match[1]}+ Years`;
        }
        break;
      }
    }

    if (!experience) {
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
      'Bachelor', 'Master', 'PhD', 'B.S.', 'M.S.', 'Diploma'
    ];
    for (const degree of degrees) {
      const escaped = degree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const startBoundary = /^\w/.test(degree) ? '\\b' : '';
      const endBoundary = /\w$/.test(degree) ? '\\b' : '';
      const reg = new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
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
