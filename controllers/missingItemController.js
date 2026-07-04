const { MissingItem, MissingPerson, User } = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getPaginationParams,
  getPaginationMeta,
} = require("../utils/pagination");
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
    brand,
    model,
    color,
    serial_number,
    unique_identifier,
    estimated_value,
    quantity,
    photo_url,
    lost_date,
    lost_time,
    lost_location,
    landmark,
    status,
    attributes,
    remarks,
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

  const missingItem = await MissingItem.create({
    case_id,
    category,
    item_name,
    description,
    brand,
    model,
    color,
    serial_number,
    unique_identifier,
    estimated_value,
    quantity: quantity || 1,
    photo_url,
    lost_date,
    lost_time,
    lost_location,
    landmark,
    status: status || "MISSING",
    attributes: attributes || null,
    remarks,
    created_by: req.user.id,
    updated_by: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Missing item created successfully",
    data: missingItem,
  });
});

// @desc    Get all missing items
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
        // {
        //   model: MissingPerson,
        //   as: "case",
        // },
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
