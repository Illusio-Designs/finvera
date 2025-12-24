const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');
const companyController = require('../controllers/companyController');
const { uploadCompanyLogo, uploadCompanySignature, uploadDSCCertificate } = require('../config/multer');

const router = Router();

// Tenant-side routes: do NOT require tenant DB provisioned
router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

// Allow tenant roles to manage company
router.get('/', requireRole(ROLES.TENANT_ADMIN, ROLES.USER, ROLES.ACCOUNTANT), companyController.list);
router.get('/status', requireRole(ROLES.TENANT_ADMIN, ROLES.USER, ROLES.ACCOUNTANT), companyController.status);
router.post('/', requireRole(ROLES.TENANT_ADMIN, ROLES.USER), companyController.create);
router.get('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.USER, ROLES.ACCOUNTANT), companyController.getById);
router.put('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.USER), companyController.update);

// File upload routes
router.post(
  '/:id/upload-logo',
  requireRole(ROLES.TENANT_ADMIN, ROLES.USER),
  uploadCompanyLogo.single('logo'),
  companyController.uploadLogo
);
router.post(
  '/:id/upload-signature',
  requireRole(ROLES.TENANT_ADMIN, ROLES.USER),
  uploadCompanySignature.single('signature'),
  companyController.uploadSignature
);
router.post(
  '/:id/upload-dsc-certificate',
  requireRole(ROLES.TENANT_ADMIN, ROLES.USER),
  uploadDSCCertificate.single('certificate'),
  companyController.uploadDSCCertificate
);

// DSC configuration route
router.put(
  '/:id/dsc-config',
  requireRole(ROLES.TENANT_ADMIN, ROLES.USER),
  companyController.updateDSCConfig
);

module.exports = router;

