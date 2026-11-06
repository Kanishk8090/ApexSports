const { DashboardService } = require('../services/dashboardService');

const getDashboardData = async (req, res, next) => {
  try {
    const data = await DashboardService.getSummary();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
};
