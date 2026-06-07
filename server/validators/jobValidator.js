const validateJob = (req, res, next) => {
  const { title, company, location, salary, jobType, description } = req.body;
  const errors = {};

  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.title = 'Job title is required';
  }
  if (!company || typeof company !== 'string' || company.trim() === '') {
    errors.company = 'Company name is required';
  }
  if (!location || typeof location !== 'string' || location.trim() === '') {
    errors.location = 'Location is required';
  }

  // Salary validation
  if (salary === undefined || salary === null || salary === '') {
    errors.salary = 'Salary is required';
  } else {
    const numSalary = Number(salary);
    if (isNaN(numSalary) || numSalary <= 0) {
      errors.salary = 'Salary must be a positive number';
    }
  }

  // JobType validation
  const validJobTypes = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Remote'];
  if (!jobType || !validJobTypes.includes(jobType)) {
    errors.jobType = `Job type is required and must be one of: ${validJobTypes.join(', ')}`;
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.description = 'Job description is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validateJob };
