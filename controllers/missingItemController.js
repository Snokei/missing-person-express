const { MissingItem, MissingPerson, User } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const { getPaginationParams } = require("../utils/pagination");
const { Op } = require("sequelize");

// @desc    Create a new missing item
// @route   POST /api/missing-items
// @access  Private
exports.createMissingItem = asyncHandler(async (req, res) => {
  const {
    case_id,
    category,
    item_name,
    description,
    quantity,
    estimated_value,
    lost_date,
    lost_time,
    lost_location,
    landmark,
    status,
    remarks,
    // Extract known non-attribute fields first, rest go into attributes
    attributes,
    ...rest
  } = req.body;

  // Validate required fields
  if (!case_id || !category || !item_name || !lost_date || !lost_location) {
    return res.status(400).json({
      success: false,
      message:
        "case_id, category, item_name, lost_date and lost_location are required",
    });
  }

  // Verify that the case exists
  const existingCase = await MissingPerson.findByPk(case_id);
  if (!existingCase) {
    return res.status(404).json({
      success: false,
      message: "Case not found",
    });
  }

  // Merge explicitly provided attributes + any extra fields from the body.
  // This allows sending category-specific fields (e.g., brand, model, imei,
  // passport_number, aadhaar_number) directly in the request body — they
  // automatically land in the attributes JSONB.
  const mergedAttributes = {
    ...(attributes || {}),
    ...rest,
  };

  const payload = {
    case_id,
    category,
    item_name,
    description: description || null,
    quantity: quantity || 1,
    estimated_value: estimated_value || null,
    lost_date,
    lost_time: lost_time || null,
    lost_location,
    landmark: landmark || null,
    status: status || "MISSING",
    attributes: Object.keys(mergedAttributes).length > 0 ? mergedAttributes : {},
    remarks: remarks || null,
    created_by: req.user.id,
  };

  const missingItem = await MissingItem.create(payload);

  res.status(201).json({
    success: true,
    message: "Missing item created successfully",
    data: missingItem,
  });
});

// @desc    Get all missing items (with filters, search, pagination)
// @route   GET /api/missing-items
// @access  Private
exports.getMissingItems = asyncHandler(async (req, res) => {
  const { page, per_page, offset } = getPaginationParams(req.query);
  const { search, category, status, case_id } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { item_name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { lost_location: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status;
  }

  if (case_id) {
    where.case_id = case_id;
  }

  const { rows: missingItems, count: total } =
    await MissingItem.findAndCountAll({
      where,
      limit: per_page,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: MissingPerson,
          as: "case",
        },
        {
          model: User,
          as: "reportedBy",
          attributes: {
            exclude: [
              "password",
              "refresh_token",
              "expo_push_token",
              "otp",
              "otp_expiry",
            ],
          },
        },
      ],
    });

  res.json({
    success: true,
    page,
    limit: per_page,
    total,
    data: missingItems,
  });
});

// @desc    Get missing item by ID
// @route   GET /api/missing-items/:id
// @access  Private
exports.getMissingItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const missingItem = await MissingItem.findByPk(id, {
    include: [
      {
        model: MissingPerson,
        as: "case",
      },
      {
        model: User,
        as: "reportedBy",
        attributes: {
          exclude: [
            "password",
            "refresh_token",
            "expo_push_token",
            "otp",
            "otp_expiry",
          ],
        },
      },
      {
        model: User,
        as: "updatedBy",
        attributes: {
          exclude: [
            "password",
            "refresh_token",
            "expo_push_token",
            "otp",
            "otp_expiry",
          ],
        },
      },
    ],
  });

  if (!missingItem) {
    return res.status(404).json({
      success: false,
      message: "Missing item not found",
    });
  }

  res.json({
    success: true,
    data: missingItem,
  });
});