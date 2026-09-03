const express = require("express");
const router = express.Router();
const companyController = require("../../controller/v1/admin/admin");
// const { verifyToken, requireRole } = require("../middleware/auth"); // TODO: protect these behind Super Admin auth

router.post("/company", companyController.createCompany);
router.get("/company", companyController.getAllCompanies);
router.get("/company/:id", companyController.getCompanyById);
router.patch("/company/:id", companyController.updateCompany);
router.delete("/company/:id", companyController.deleteCompany);
router.post("/company/login/:companyId", companyController.companyLogin);

module.exports = router;
