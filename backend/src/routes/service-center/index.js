const {} = require("../../controller/v1/company/company");
const {
  serviceCenterJobs,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} = require("../../controller/v1/service-center/serviceCenter");
const { serviceCenterCheck } = require("../../middlewares/validatoin");

const router = require("express").Router();

router.get("/jobs", serviceCenterCheck, serviceCenterJobs);

router.get("/getProfile", serviceCenterCheck, getMyProfile);
router.put("/updateProfile", serviceCenterCheck, updateMyProfile);
router.put("/changePassword", serviceCenterCheck, changeMyPassword);

module.exports = router;
