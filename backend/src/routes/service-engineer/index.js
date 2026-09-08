const {
  serviceEngineerJobs,
  changeMyPassword,
  updateMyProfile,
  getMyProfile,
  getServiceEngineerJobById,
  serviceEngineerHoldJob,
  serviceEngineerCloseJob,
  serviceEngineerGetJobLogs,
  getDashboardStats,
  getMySparePartStock,
} = require("../../controller/v1/service-engineer/serviceEngineer");
const { serviceEngineerCheck } = require("../../middlewares/validatoin");

const router = require("express").Router();

router.get("/getJobs", serviceEngineerCheck, serviceEngineerJobs);
router.get("/getJobById/:id", serviceEngineerCheck, getServiceEngineerJobById);
router.put("/holdJob/:id", serviceEngineerCheck, serviceEngineerHoldJob);
router.put("/closeJob/:id", serviceEngineerCheck, serviceEngineerCloseJob);
router.get("/getJobLogs/:id", serviceEngineerCheck, serviceEngineerGetJobLogs);

router.get("/getProfile", serviceEngineerCheck, getMyProfile);
router.put("/updateProfile", serviceEngineerCheck, updateMyProfile);
router.put("/changePassword", serviceEngineerCheck, changeMyPassword);

// Dashboard
router.get("/dashboard-stats", serviceEngineerCheck, getDashboardStats);

router.get("/getMySparePartStock", serviceEngineerCheck, getMySparePartStock);

module.exports = router;
