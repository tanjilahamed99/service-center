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

  getMyProfile,
  changeMyPassword,
  updateMyProfile,
  getDashboardStats,
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,

  allocateSparePart,
  createSparePart,
  deleteSparePart,
  getSparePartById,
  getSparePartStock,
  getSparePartTransactions,
  getSpareParts,
  restockSparePart,
  updateSparePart,
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

router.get("/getProfile", companyCheck, getMyProfile);
router.put("/updateProfile", companyCheck, updateMyProfile);
router.put("/changePassword", companyCheck, changeMyPassword);

router.get("/getDashboardStats", companyCheck, getDashboardStats);

router.post("/products", companyCheck, createProduct);
router.get("/products", companyCheck, getProducts);
router.get("/products/:id", companyCheck, getProductById);
router.put("/products/:id", companyCheck, updateProduct);
router.delete("/products/:id", companyCheck, deleteProduct);

router.post("/createSparePart", companyCheck, createSparePart);
router.get("/getSpareParts", companyCheck, getSpareParts);
router.get("/getSparePartById/:id", companyCheck, getSparePartById);
router.put("/updateSparePart/:id", companyCheck, updateSparePart);
router.delete("/deleteSparePart/:id", companyCheck, deleteSparePart);
router.post("/restockSparePart/:id", companyCheck, restockSparePart);
router.post("/allocateSparePart/:id", companyCheck, allocateSparePart);
router.get("/getSparePartStock", companyCheck, getSparePartStock);
router.get(
  "/getSparePartTransactions/:id",
  companyCheck,
  getSparePartTransactions,
);

module.exports = router;
