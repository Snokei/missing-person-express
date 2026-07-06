const { MissingPerson } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getPaginationParams,
  getPaginationMeta,
} = require("../utils/pagination");
const {
  ingestMissingPerson,
  deleteVector,
} = require("../services/vectorStoreService");

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
    missing_person_mobile_number,
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
    missing_person_mobile_number,
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

  // Auto-ingest into vector store for RAG search
  try {
    await ingestMissingPerson(missingPerson.id);
  } catch (vectorError) {
    console.error("⚠️ Failed to ingest vector for new record:", vectorError.message);
    // Non-blocking: don't fail the request if vector ingestion fails
  }

  res.status(201).json({
    success: true,
    message: "Missing person record created successfully",
    data: missingPerson,
  });
});

// @desc    Get all missing persons (supports CSV/PDF export)
// @route   GET /api/missing-persons
// @access  Private
exports.getAllMissingPersons = asyncHandler(async (req, res) => {
  const {
    status,
    query,
    gender,
    age_from: ageFrom,
    age_to: ageTo,
    date_from: dateFrom,
    date_to: dateTo,
    locations,
    export_format, // NEW: 'csv' or 'pdf'
  } = req.query;

  const { Op } = require("sequelize");
  const { page, per_page, offset } = getPaginationParams(req.query);
  const where = {};

  if (status) {
    const statusList = status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statusList.length > 0) {
      where.status = { [Op.in]: statusList };
    }
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
      { first_name: { [Op.iLike]: `%${query}%` } },
      { last_name: { [Op.iLike]: `%${query}%` } },
      { case_number: { [Op.iLike]: `%${query}%` } },
    ];
  }
  if (locations) {
    const locationList = locations
      .split(",")
      .map((loc) => loc.trim())
      .filter(Boolean);
    if (locationList.length > 0) {
      where.last_seen_location = { [Op.in]: locationList };
    }
  }

  const isExport = export_format === "csv" || export_format === "pdf";

  const queryOptions = {
    where,
    order: [["createdAt", "DESC"]],
  };

  if (!isExport) {
    queryOptions.limit = per_page;
    queryOptions.offset = offset;
  }

  const { rows: missingPersons, count: total } =
    await MissingPerson.findAndCountAll(queryOptions);

  if (isExport) {
    return res.json({
      success: true,
      is_export: true,
      export_format,
      total_exported: missingPersons.length,
      data: missingPersons,
    });
  }

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

// @desc    Get case statistics (total, found, missing, closed)
// @route   GET /api/missing-persons/stats
// @access  Private
exports.getCaseStats = asyncHandler(async (req, res) => {
  const total = await MissingPerson.count();
  const missing = await MissingPerson.count({ where: { status: "Missing" } });
  const found = await MissingPerson.count({ where: { status: "Found" } });
  const closed = await MissingPerson.count({ where: { status: "Closed" } });

  res.json({
    success: true,
    data: {
      total,
      missing,
      found,
      closed,
    },
  });
});

// @desc    Update a missing person record
// @route   PUT /api/missing-persons/:id
// @access  Private
exports.updateMissingPerson = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const missingPerson = await MissingPerson.findByPk(id);

  if (!missingPerson) {
    return res.status(404).json({
      success: false,
      message: "Missing person record not found",
    });
  }

  const allowedFields = [
    "case_number",
    "photo_url",
    "first_name",
    "last_name",
    "gender",
    "age",
    "language_spoken",
    "height",
    "weight",
    "medical_condition",
    "identification_mark",
    "reporter_name",
    "mobile_number",
    "alternative_number",
    "relationship",
    "address",
    "last_seen_date",
    "last_seen_time",
    "last_seen_location",
    "circumstances",
    "status",
    "missing_person_mobile_number",
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  await missingPerson.update(updateData);

  // Re-ingest vector for updated record
  try {
    await ingestMissingPerson(missingPerson.id);
  } catch (vectorError) {
    console.error("⚠️ Failed to update vector for record:", vectorError.message);
  }

  res.json({
    success: true,
    message: "Missing person record updated successfully",
    data: missingPerson,
  });
});

// @desc    Delete a missing person record
// @route   DELETE /api/missing-persons/:id
// @access  Private
exports.deleteMissingPerson = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const missingPerson = await MissingPerson.findByPk(id);

  if (!missingPerson) {
    return res.status(404).json({
      success: false,
      message: "Missing person record not found",
    });
  }

  // Delete associated vector embedding first
  try {
    await deleteVector(missingPerson.id);
  } catch (vectorError) {
    console.error("⚠️ Failed to delete vector for record:", vectorError.message);
  }

  await missingPerson.destroy();

  res.json({
    success: true,
    message: "Missing person record deleted successfully",
  });
});
