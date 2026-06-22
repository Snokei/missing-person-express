const { Tracking } = require("../models");

exports.saveTracking = async (req, res) => {
  try {
    const { user_id, latitude, longitude } = req.body;

    let tracking = await Tracking.findOne({
      where: { user_id },
    });

    if (tracking) {
      await tracking.update({
        latitude,
        longitude,
        tracked_at: new Date(),
      });
    } else {
      tracking = await Tracking.create({
        user_id,
        latitude,
        longitude,
      });
    }

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getLatestTracking = async (req, res) => {
  try {
    const { userId } = req.params;

    const tracking = await Tracking.findOne({
      where: {
        user_id: userId,
      },
      order: [["tracked_at", "DESC"]],
    });

    res.json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
