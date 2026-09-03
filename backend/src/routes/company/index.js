const {
  // Jobs
  createJob,
  getJobs,
  getJobById,
  updateJob,
  assignJob,
  holdJob,
  closeJob,
  cancelJob,
  getJobLogs,

  // Customers
  searchCustomers,
  createCustomer,
  getCustomerPreviousJobs,

  // Lookups (used to populate dropdowns on the Create Job / filter bar)
  getServiceCenters,
  getServiceEngineers,

  getServiceCenterById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
  getServiceEngineerById,
  createServiceEngineer,
  updateServiceEngineer,
  deleteServiceEngineer,
} = require("../../controller/v1/company/company");
const { companyCheck } = require("../../middlewares/validatoin");

const router = require("express").Router();

// ---------- Jobs ----------
router.post("/createJob", companyCheck, createJob);
router.get("/getJobs", companyCheck, getJobs);
router.get("/getJobById/:id", companyCheck, getJobById);
router.put("/updateJob/:id", companyCheck, updateJob);
router.post("/assignJob", companyCheck, assignJob); // body: { jobIds: [], serviceCenter, scheduleDate, note } — handles single (1 id) or bulk assign
router.put("/holdJob/:id", companyCheck, holdJob);
router.put("/closeJob/:id", companyCheck, closeJob);
router.put("/cancelJob/:id", companyCheck, cancelJob);
router.get("/getJobLogs/:id", companyCheck, getJobLogs);

// ---------- Customers ----------
router.get("/searchCustomers", companyCheck, searchCustomers); // query: ?search=name-or-mobile
router.post("/createCustomer", companyCheck, createCustomer);
router.get(
  "/getCustomerPreviousJobs/:customerId",
  companyCheck,
  getCustomerPreviousJobs,
);

// ---------- Lookups ----------
// router.get("/getServiceCenters", companyCheck, getServiceCenters);
router.get("/getServiceEngineers", companyCheck, getServiceEngineers); // query: ?serviceCenter=<id> (optional)

// ---------- Service Centers ----------
router.get("/getServiceCenters", companyCheck, getServiceCenters);
router.get("/getServiceCenterById/:id", companyCheck, getServiceCenterById);
router.post("/createServiceCenter", companyCheck, createServiceCenter);
router.put("/updateServiceCenter/:id", companyCheck, updateServiceCenter);
router.delete("/deleteServiceCenter/:id", companyCheck, deleteServiceCenter);

// ---------- Service Engineers ----------
// router.get("/getServiceEngineers", getServiceEngineers);
router.get("/getServiceEngineerById/:id", companyCheck, getServiceEngineerById);
router.post("/createServiceEngineer", companyCheck, createServiceEngineer);
router.put("/updateServiceEngineer/:id", companyCheck, updateServiceEngineer);
router.delete(
  "/deleteServiceEngineer/:id",
  companyCheck,
  deleteServiceEngineer,
);

module.exports = router;
