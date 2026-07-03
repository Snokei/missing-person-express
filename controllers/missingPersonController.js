const { MissingPerson } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Create a new missing person record
// @route   POST /api/missing-persons
// @access  Private
exports.createMissingPerson = asyncHandler(async (req, res) => {
  const {
    case_number,
    photo_url,
    first_name,
    last_name,
    gender,
    age,
    language_spoken,
    height,
    weight,
    medical_condition,
    identification_mark,
    reporter_name,
    mobile_number,
    alternative_number,
    relationship,
    address,
    last_seen_date,
    last_seen_time,
    last_seen_location,
    circumstances,
    status,
  } = req.body;

  // Validate required fields
  if (!case_number || !first_name || !reporter_name || !mobile_number) {
    return res.status(400).json({
      success: false,
      message:
        "case_number, first_name, reporter_name and mobile_number are required",
    });
  }

  // Check for duplicate case_number
  const existingCase = await MissingPerson.findOne({
    where: { case_number },
  });

  if (existingCase) {
    return res.status(400).json({
      success: false,
      message: "Case number already exists",
    });
  }

  const missingPerson = await MissingPerson.create({
    case_number,
    photo_url,
    first_name,
    last_name,
    gender,
    age,
    language_spoken,
    height,
    weight,
    medical_condition,
    identification_mark,
    reporter_name,
    mobile_number,
    alternative_number,
    relationship,
    address,
    last_seen_date,
    last_seen_time,
    last_seen_location,
    circumstances,
    status: status || "Missing",
    created_by: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: "Missing person record created successfully",
    data: missingPerson,
  });
});

// @desc    Get all missing persons
// @route   GET /api/missing-persons
// @access  Private
exports.getAllMissingPersons = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const where = {};
  if (status) {
    where.status = status;
  }

  const missingPersons = await MissingPerson.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  res.json({
    success: true,
    count: missingPersons.length,
    data: missingPersons,
  });
});

// @desc    Get a single missing person by id
// @route   GET /api/missing-persons/:id
// @access  Private
exports.getMissingPersonById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const missingPerson = await MissingPerson.findByPk(id);

  if (!missingPerson) {
    return res.status(404).json({
      success: false,
      message: "Missing person record not found",
    });
  }

  res.json({
    success: true,
    data: missingPerson,
  });
});
