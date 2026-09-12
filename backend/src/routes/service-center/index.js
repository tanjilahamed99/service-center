const {
  serviceCenterJobs,
  getJobLogs,
  assignJob,
  holdJob,
  closeJob,
  cancelJob,
  updateJobStatus,
  getServiceEngineers,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getDashboardStats,
  serviceEngineerLoginByCenter,
  getMySparePartStock,
  getMySparePartTransactions,
} = require("../../controller/v1/service-center/serviceCenter");
const { serviceCenterCheck } = require("../../middlewares/validatoin");

const router = require("express").Router();

// Jobs
router.get("/jobs", serviceCenterCheck, serviceCenterJobs);
router.get("/getJobLogs/:id", serviceCenterCheck, getJobLogs);
router.post("/assignJob", serviceCenterCheck, assignJob);
router.put("/holdJob/:id", serviceCenterCheck, holdJob);
router.put("/closeJob/:id", serviceCenterCheck, closeJob);
router.put("/cancelJob/:id", serviceCenterCheck, cancelJob);
router.put("/updateJobStatus/:id", serviceCenterCheck, updateJobStatus);

// Service Engineers (scoped to this service center)
router.get("/getServiceEngineers", serviceCenterCheck, getServiceEngineers);

// Profile
router.get("/getProfile", serviceCenterCheck, getMyProfile);
router.put("/updateProfile", serviceCenterCheck, updateMyProfile);
router.put("/changePassword", serviceCenterCheck, changeMyPassword);

// Dashboard
router.get("/dashboard-stats", serviceCenterCheck, getDashboardStats);

router.post(
  "/service-engineer/:id",
  serviceCenterCheck,
  serviceEngineerLoginByCenter,
);

router.get("/getMySparePartStock", serviceCenterCheck, getMySparePartStock);
router.get(
  "/getMySparePartTransactions",
  serviceCenterCheck,
  getMySparePartTransactions,
);

module.exports = router;
