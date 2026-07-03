const { MissingPerson } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getPaginationParams,
  getPaginationMeta,
} = require("../utils/pagination");

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
  const { status, query, gender, ageFrom, ageTo, dateFrom, dateTo } = req.query;
  const { Op } = require("sequelize");
  const { page, per_page, offset } = getPaginationParams(req.query);
  const where = {};
  if (status) {
    where.status = status;
  }
  if (gender) {
    where.gender = gender;
  }
  if (ageFrom || ageTo) {
    if (ageFrom && ageTo) {
      where.age = { [Op.between]: [ageFrom, ageTo] };
    } else if (ageFrom) {
      where.age = { [Op.gte]: ageFrom };
    } else if (ageTo) {
      where.age = { [Op.lte]: ageTo };
    }
  }
  if (dateFrom || dateTo) {
    if (dateFrom && dateTo) {
      where.last_seen_date = { [Op.between]: [dateFrom, dateTo] };
    } else if (dateFrom) {
      where.last_seen_date = { [Op.gte]: dateFrom };
    } else if (dateTo) {
      where.last_seen_date = { [Op.lte]: dateTo };
    }
  }
  if (query) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${query}%` } },
      { case_number: { [Op.like]: `%${query}%` } },
    ];
  }

  const { rows: missingPersons, count: total } =
    await MissingPerson.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: per_page,
      offset,
    });

  res.json({
    success: true,
    meta: getPaginationMeta(total, page, per_page),
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
