const {} = require("../../controller/v1/company/company");
const {
  serviceCenterJobs,
} = require("../../controller/v1/service-center/serviceCenter");
const { serviceCenterCheck } = require("../../middlewares/validatoin");

const router = require("express").Router();

router.get("/jobs", serviceCenterCheck, serviceCenterJobs);

module.exports = router;
