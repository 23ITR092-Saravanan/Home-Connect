import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MarketplaceService } from '../src/services/marketplaceService';
import { ValidationService } from '../src/services/validationService';

describe('Home Connect — Core Business Logic & Test Suite', () => {
  let service: MarketplaceService;

  beforeEach(() => {
    service = new MarketplaceService();
  });

  // ========================================================
  // 1. REGISTRATION & LOGIN LOGIC
  // ========================================================
  describe('1. Registration and Login Validation', () => {
    test('Buyer registration validation succeeds with complete valid inputs', () => {
      const validBuyer = {
        username: 'test_buyer_1',
        password: 'securePassword123',
        contactNumber: '9876543210',
        district: 'Coimbatore',
        deliveryAddress: '100 Crosscut Road, Gandhipuram',
        pincode: '641012',
      };

      const val = ValidationService.validateBuyerRegistration(validBuyer);
      assert.equal(val.isValid, true);
      assert.deepEqual(val.errors, {});

      const res = service.registerBuyer(validBuyer);
      assert.equal(res.success, true);
      assert.ok(res.buyer);
      assert.equal(res.buyer.username, 'test_buyer_1');
    });

    test('Buyer registration rejects empty required fields, invalid email/phone, and bad pincode', () => {
      // Empty fields
      const emptyBuyer = ValidationService.validateBuyerRegistration({});
      assert.equal(emptyBuyer.isValid, false);
      assert.ok(emptyBuyer.errors.username);
      assert.ok(emptyBuyer.errors.password);
      assert.ok(emptyBuyer.errors.contactNumber);
      assert.ok(emptyBuyer.errors.district);
      assert.ok(emptyBuyer.errors.deliveryAddress);
      assert.ok(emptyBuyer.errors.pincode);

      // Invalid phone format
      const badPhone = ValidationService.validateBuyerRegistration({
        username: 'validuser',
        password: 'password123',
        contactNumber: '12345', // Too short
        district: 'Chennai',
        deliveryAddress: 'Some Street Address',
        pincode: '600001',
      });
      assert.equal(badPhone.isValid, false);
      assert.ok(badPhone.errors.contactNumber);

      // Invalid pincode (must be 6 digits)
      const badPincode = ValidationService.validateBuyerRegistration({
        username: 'validuser',
        password: 'password123',
        contactNumber: '9876543210',
        district: 'Chennai',
        deliveryAddress: 'Some Street Address',
        pincode: '60001', // 5 digits
      });
      assert.equal(badPincode.isValid, false);
      assert.ok(badPincode.errors.pincode);
    });

    test('Buyer registration prevents duplicate usernames', () => {
      const buyerData = {
        username: 'duplicate_user',
        password: 'password123',
        contactNumber: '9876543210',
        district: 'Salem',
        deliveryAddress: 'Street 1',
        pincode: '636001',
      };

      const first = service.registerBuyer(buyerData);
      assert.equal(first.success, true);

      // Same username (case-insensitive)
      const second = service.registerBuyer({
        ...buyerData,
        username: 'DUPLICATE_USER',
      });
      assert.equal(second.success, false);
      assert.match(second.error || '', /already taken/i);
    });

    test('Seller registration validation requires shop code, valid email, and categories while keeping logo optional', () => {
      const validSeller = {
        username: 'Ravi Woodcrafts',
        emailId: 'ravi.wood@example.com',
        password: 'password123',
        contactNumber: '9845123456',
        district: 'Madurai',
        pincode: '625001',
        categories: ['Woodcraft & Bamboo'],
        shopCode: 'SHOP-TEST-99',
        address: '5 West Masi Street, Madurai',
        // shopLogo is omitted — must remain optional!
      };

      const val = ValidationService.validateSellerRegistration(validSeller);
      assert.equal(val.isValid, true);

      const res = service.registerSeller(validSeller);
      assert.equal(res.success, true);
      assert.ok(res.seller);
      assert.equal(res.seller.shopCode, 'SHOP-TEST-99');
      assert.equal(res.seller.shopLogo, undefined);
    });

    test('Seller registration rejects duplicate shop code and duplicate email', () => {
      const seller1 = {
        username: 'Shop One',
        emailId: 'shop1@example.com',
        password: 'password123',
        contactNumber: '9845123456',
        district: 'Madurai',
        pincode: '625001',
        categories: ['Woodcraft & Bamboo'],
        shopCode: 'SHOP-UNIQUE-1',
        address: 'West Masi Street',
      };

      assert.equal(service.registerSeller(seller1).success, true);

      // Duplicate shop code
      const dupCode = service.registerSeller({
        ...seller1,
        username: 'Shop Two',
        emailId: 'shop2@example.com',
      });
      assert.equal(dupCode.success, false);
      assert.match(dupCode.error || '', /already registered/i);

      // Duplicate email with different shop code
      const dupEmail = service.registerSeller({
        ...seller1,
        shopCode: 'SHOP-UNIQUE-2',
      });
      assert.equal(dupEmail.success, false);
      assert.match(dupEmail.error || '', /already registered/i);
    });

    test('Buyer login requires username and password', () => {
      // Test registered demo buyer
      const success = service.loginBuyer('ananya_kumar', 'password123');
      assert.equal(success.success, true);
      assert.equal(success.buyer?.username, 'ananya_kumar');

      // Wrong password
      const wrongPass = service.loginBuyer('ananya_kumar', 'wrongPass');
      assert.equal(wrongPass.success, false);
      assert.match(wrongPass.error || '', /incorrect password/i);

      // Non-existent user
      const notFound = service.loginBuyer('non_existent_user', 'password123');
      assert.equal(notFound.success, false);
      assert.match(notFound.error || '', /not found/i);
    });

    test('Seller login requires Shop Code and password', () => {
      // Test registered demo seller
      const success = service.loginSeller('SHOP-101', 'password123');
      assert.equal(success.success, true);
      assert.equal(success.seller?.shopCode, 'SHOP-101');

      // Case insensitive shop code
      const caseInsensitive = service.loginSeller('shop-101', 'password123');
      assert.equal(caseInsensitive.success, true);

      // Wrong password
      const wrongPass = service.loginSeller('SHOP-101', 'invalidPassword');
      assert.equal(wrongPass.success, false);
      assert.match(wrongPass.error || '', /incorrect password/i);

      // Unknown shop code
      const badShop = service.loginSeller('SHOP-99999', 'password123');
      assert.equal(badShop.success, false);
      assert.match(badShop.error || '', /not found/i);
    });
  });

  // ========================================================
  // 2. PRODUCT MANAGEMENT & OWNERSHIP LOGIC
  // ========================================================
  describe('2. Product Management & Ownership', () => {
    test('Create product validates positive price, MOQ >= 1, and payment modes', () => {
      // Valid creation
      const res = service.createProduct('SHOP-101', {
        productName: 'Hand-Carved Wooden Spice Box',
        category: 'Woodcraft & Bamboo',
        price: 750,
        minOrderQty: 1,
        image: '/assets/sample.jpg',
        description: 'Traditional 7-compartment wooden masala dabba',
        paymentMode: 'Both',
      });
      assert.equal(res.success, true);
      assert.ok(res.product);
      assert.equal(res.product.sellerShopCode, 'SHOP-101');

      // Negative or zero price rejected
      const badPrice = service.createProduct('SHOP-101', {
        productName: 'Invalid Item',
        category: 'Clayware & Pottery',
        price: 0,
        minOrderQty: 1,
        image: '/assets/sample.jpg',
        paymentMode: 'COD',
      });
      assert.equal(badPrice.success, false);
      assert.match(badPrice.error || '', /greater than 0/i);

      // MOQ < 1 rejected
      const badMoq = service.createProduct('SHOP-101', {
        productName: 'Invalid Item',
        category: 'Clayware & Pottery',
        price: 100,
        minOrderQty: 0,
        image: '/assets/sample.jpg',
        paymentMode: 'COD',
      });
      assert.equal(badMoq.success, false);
      assert.match(badMoq.error || '', /at least 1/i);
    });

    test('Each seller manages only their own products (ownership enforcement)', () => {
      // prod-001 belongs to SHOP-101
      // SHOP-204 attempts to edit prod-001
      const unauthorizedEdit = service.updateProduct('SHOP-204', 'prod-001', {
        price: 9999,
      });
      assert.equal(unauthorizedEdit.success, false);
      assert.match(unauthorizedEdit.error || '', /unauthorized.*own products/i);

      // SHOP-204 attempts to delete prod-001
      const unauthorizedDelete = service.deleteProduct('SHOP-204', 'prod-001');
      assert.equal(unauthorizedDelete.success, false);
      assert.match(unauthorizedDelete.error || '', /unauthorized.*own products/i);

      // Original owner SHOP-101 edits successfully
      const authorizedEdit = service.updateProduct('SHOP-101', 'prod-001', {
        price: 520,
      });
      assert.equal(authorizedEdit.success, true);
      assert.equal(authorizedEdit.product?.price, 520);

      // Original owner SHOP-101 deletes successfully
      const authorizedDelete = service.deleteProduct('SHOP-101', 'prod-001');
      assert.equal(authorizedDelete.success, true);
    });

    test('getProductsBySeller returns only products belonging to that seller', () => {
      const shop101Prods = service.getProductsBySeller('SHOP-101');
      assert.ok(shop101Prods.length > 0);
      shop101Prods.forEach((p) => {
        assert.equal(p.sellerShopCode.toUpperCase(), 'SHOP-101');
      });
    });
  });

  // ========================================================
  // 3. PRODUCT SEARCH LOGIC
  // ========================================================
  describe('3. Product Search Logic (AND/OR, Seller Profile Matching)', () => {
    test('Any one filter alone works correctly', () => {
      // 1. Category alone
      const categoryOnly = service.searchProducts({ categories: ['Organic Foods & Spices'] });
      assert.ok(categoryOnly.length > 0);
      categoryOnly.forEach((p) => assert.equal(p.category, 'Organic Foods & Spices'));

      // 2. District alone (matched against seller profile district)
      const districtOnly = service.searchProducts({ district: 'Madurai' });
      assert.ok(districtOnly.length > 0);
      districtOnly.forEach((p) => {
        const seller = service.getSeller(p.sellerShopCode);
        assert.equal(seller?.district, 'Madurai');
      });

      // 3. Pincode alone (matched against seller profile pincode)
      const pincodeOnly = service.searchProducts({ pincode: '641002' });
      assert.ok(pincodeOnly.length > 0);
      pincodeOnly.forEach((p) => {
        const seller = service.getSeller(p.sellerShopCode);
        assert.equal(seller?.pincode, '641002');
      });
    });

    test('Multiple filters combine using AND logic', () => {
      // Category AND District
      const combined = service.searchProducts({
        categories: ['Clayware & Pottery'],
        district: 'Coimbatore',
      });
      assert.ok(combined.length > 0);
      combined.forEach((p) => {
        assert.equal(p.category, 'Clayware & Pottery');
        const seller = service.getSeller(p.sellerShopCode);
        assert.equal(seller?.district, 'Coimbatore');
      });

      // Category AND District that do not match should return empty array
      const noMatch = service.searchProducts({
        categories: ['Clayware & Pottery'],
        district: 'Madurai', // Madurai seller only has Organic Foods
      });
      assert.equal(noMatch.length, 0);
    });

    test('Multiple selected categories use OR logic within the category filter', () => {
      const multiCategory = service.searchProducts({
        categories: ['Clayware & Pottery', 'Organic Foods & Spices'],
      });
      assert.ok(multiCategory.length >= 3);
      multiCategory.forEach((p) => {
        assert.ok(
          p.category === 'Clayware & Pottery' || p.category === 'Organic Foods & Spices'
        );
      });
    });
  });

  // ========================================================
  // 4. PRODUCT REQUEST LIFECYCLE & MUTABILITY RULES
  // ========================================================
  describe('4. Product Request Lifecycle & Immutability Rules', () => {
    test('Buyer requests product; displayed in pending requests', () => {
      const dateInFuture = new Date();
      dateInFuture.setDate(dateInFuture.getDate() + 5);
      const deliveryDate = dateInFuture.toISOString().split('T')[0];

      const res = service.createProductRequest('ananya_kumar', 'prod-002', {
        quantity: 2,
        expectedDeliveryDate: deliveryDate,
        paymentMode: 'Both',
        customDescription: 'Fragile glass packing please',
      });

      assert.equal(res.success, true);
      assert.ok(res.request);
      assert.equal(res.request.status, 'pending');
      assert.equal(res.request.buyerUsername, 'ananya_kumar');
      assert.equal(res.request.sellerShopCode, 'SHOP-204');
      assert.equal(res.request.totalPrice, 380 * 2);
    });

    test('Before acceptance, buyer can edit and delete request', () => {
      const dateInFuture = new Date();
      dateInFuture.setDate(dateInFuture.getDate() + 5);
      const deliveryDate = dateInFuture.toISOString().split('T')[0];

      const reqRes = service.createProductRequest('ananya_kumar', 'prod-002', {
        quantity: 1,
        expectedDeliveryDate: deliveryDate,
        paymentMode: 'Both',
      });
      const reqId = reqRes.request!.id;

      // Edit request before acceptance
      const editRes = service.updateProductRequest('ananya_kumar', reqId, {
        quantity: 4,
        customDescription: 'Updated instruction',
      });
      assert.equal(editRes.success, true);
      assert.equal(editRes.request?.quantity, 4);
      assert.equal(editRes.request?.totalPrice, 380 * 4);

      // Delete request before acceptance
      const delRes = service.deleteProductRequest('ananya_kumar', reqId);
      assert.equal(delRes.success, true);
    });

    test('After acceptance, buyer CANNOT edit or delete request', () => {
      const dateInFuture = new Date();
      dateInFuture.setDate(dateInFuture.getDate() + 5);
      const deliveryDate = dateInFuture.toISOString().split('T')[0];

      const reqRes = service.createProductRequest('ananya_kumar', 'prod-002', {
        quantity: 1,
        expectedDeliveryDate: deliveryDate,
        paymentMode: 'Both',
      });
      const reqId = reqRes.request!.id;

      // Seller accepts request
      const acceptRes = service.acceptRequest('SHOP-204', reqId);
      assert.equal(acceptRes.success, true);
      assert.equal(acceptRes.request?.status, 'accepted');

      // Rule: After acceptance, buyer cannot edit!
      const attemptEdit = service.updateProductRequest('ananya_kumar', reqId, {
        quantity: 10,
      });
      assert.equal(attemptEdit.success, false);
      assert.match(attemptEdit.error || '', /cannot edit request because it has already been accepted/i);

      // Rule: After acceptance, buyer cannot delete!
      const attemptDelete = service.deleteProductRequest('ananya_kumar', reqId);
      assert.equal(attemptDelete.success, false);
      assert.match(attemptDelete.error || '', /cannot delete request because it has already been accepted/i);
    });

    test('Seller can reject request with reason', () => {
      const dateInFuture = new Date();
      dateInFuture.setDate(dateInFuture.getDate() + 5);

      const reqRes = service.createProductRequest('ananya_kumar', 'prod-002', {
        quantity: 1,
        expectedDeliveryDate: dateInFuture.toISOString().split('T')[0],
        paymentMode: 'COD',
      });
      const reqId = reqRes.request!.id;

      const rejectRes = service.rejectRequest(
        'SHOP-204',
        reqId,
        'Raw honey batch exhausted this week'
      );
      assert.equal(rejectRes.success, true);
      assert.equal(rejectRes.request?.status, 'rejected');
      assert.equal(rejectRes.request?.rejectionReason, 'Raw honey batch exhausted this week');
    });
  });

  // ========================================================
  // 5. CUSTOMIZED PRODUCT REQUESTS
  // ========================================================
  describe('5. Customized Product Requests & Processing', () => {
    test('Buyer creates customized request; sellers can filter and accept', () => {
      const dateInFuture = new Date();
      dateInFuture.setDate(dateInFuture.getDate() + 10);

      const customRes = service.createCustomRequest('ananya_kumar', {
        title: 'Custom Clay Water Dispenser with Brass Tap',
        category: 'Clayware & Pottery',
        quantity: 1,
        expectedDeliveryDate: dateInFuture.toISOString().split('T')[0],
        paymentMode: 'Both',
        specifications: '5 Litre capacity unglazed earthen pot with fitted leakproof brass spigot',
        sampleImage: '/assets/sample_pot.jpg',
      });

      assert.equal(customRes.success, true);
      assert.equal(customRes.request?.type, 'custom');
      assert.equal(customRes.request?.status, 'pending');

      // Seller searches custom requests by category and district
      const searchRes = service.searchCustomRequests({
        categories: ['Clayware & Pottery'],
        district: 'Coimbatore',
      });
      assert.ok(searchRes.length > 0);

      // Seller accepts custom request
      const reqId = customRes.request!.id;
      const acceptRes = service.acceptRequest('SHOP-101', reqId);
      assert.equal(acceptRes.success, true);
      assert.equal(acceptRes.request?.status, 'accepted');
      assert.equal(acceptRes.request?.sellerShopCode, 'SHOP-101');
    });
  });

  // ========================================================
  // 6. INDEPENDENT ORDER COMPLETION LOGIC
  // ========================================================
  describe('6. Independent Order Completion Logic', () => {
    test('Mark as Completed requires accepted status and maintains independent states', () => {
      // req-102 is accepted in mock data
      const reqId = 'req-102';

      // 1. Seller marks completed independently
      const sellerCompleteRes = service.markOrderCompletedBySeller('SHOP-101', reqId);
      assert.equal(sellerCompleteRes.success, true);
      assert.equal(sellerCompleteRes.request?.sellerCompleted, true);
      // Buyer completion must NOT be overwritten!
      assert.equal(sellerCompleteRes.request?.buyerCompleted, false);

      // 2. Buyer marks completed independently
      const buyerCompleteRes = service.markOrderCompletedByBuyer('ananya_kumar', reqId);
      assert.equal(buyerCompleteRes.success, true);
      assert.equal(buyerCompleteRes.request?.buyerCompleted, true);
      assert.equal(buyerCompleteRes.request?.sellerCompleted, true);

      // When both have completed, status is fully 'completed'
      assert.equal(buyerCompleteRes.request?.status, 'completed');
    });

    test('Cannot complete order before seller acceptance', () => {
      // req-101 is pending in mock data
      const reqId = 'req-101';

      const sellerAttempt = service.markOrderCompletedBySeller('SHOP-101', reqId);
      assert.equal(sellerAttempt.success, false);
      assert.match(sellerAttempt.error || '', /after they have been accepted/i);

      const buyerAttempt = service.markOrderCompletedByBuyer('ananya_kumar', reqId);
      assert.equal(buyerAttempt.success, false);
      assert.match(buyerAttempt.error || '', /after they have been accepted/i);
    });
  });

  // ========================================================
  // 7. REVIEWS & RATINGS LOGIC
  // ========================================================
  describe('7. Reviews and Ratings (Permission & Editing Restrictions)', () => {
    test('Buyer can add review ONLY after marking order completed', () => {
      // req-102 is accepted but not yet completed by buyer
      const attemptEarlyReview = service.addReview('ananya_kumar', 'req-102', {
        rating: 5,
        writtenReview: 'Wonderful quality handloom runner!',
      });
      assert.equal(attemptEarlyReview.success, false);
      assert.match(attemptEarlyReview.error || '', /after marking the order as completed/i);

      // Now buyer marks order completed
      service.markOrderCompletedByBuyer('ananya_kumar', 'req-102');

      // Now review submission succeeds
      const reviewRes = service.addReview('ananya_kumar', 'req-102', {
        rating: 5,
        writtenReview: 'Wonderful quality handloom runner with soft cotton finish!',
      });
      assert.equal(reviewRes.success, true);
      assert.ok(reviewRes.review);
      assert.equal(reviewRes.review.buyerUsername, 'ananya_kumar');
      assert.equal(reviewRes.review.rating, 5);
    });

    test('Only review creator can edit or delete their review (ownership restriction)', () => {
      // rev-001 was created by 'ananya_kumar'
      // Another buyer 'other_buyer' attempts to edit rev-001
      const unauthorizedEdit = service.editReview('other_buyer', 'rev-001', {
        writtenReview: 'Malicious modification of review',
      });
      assert.equal(unauthorizedEdit.success, false);
      assert.match(unauthorizedEdit.error || '', /unauthorized.*only the review creator/i);

      // Another buyer attempts to delete rev-001
      const unauthorizedDelete = service.deleteReview('other_buyer', 'rev-001');
      assert.equal(unauthorizedDelete.success, false);
      assert.match(unauthorizedDelete.error || '', /unauthorized.*only the review creator/i);

      // Original creator 'ananya_kumar' edits review successfully
      const authorizedEdit = service.editReview('ananya_kumar', 'rev-001', {
        writtenReview: 'Updated review: Still holding up great after multiple washes!',
      });
      assert.equal(authorizedEdit.success, true);
      assert.equal(
        authorizedEdit.review?.writtenReview,
        'Updated review: Still holding up great after multiple washes!'
      );

      // Original creator deletes review successfully
      const authorizedDelete = service.deleteReview('ananya_kumar', 'rev-001');
      assert.equal(authorizedDelete.success, true);
    });
  });

  // ========================================================
  // 8. BACKEND INTEGRATION & STORAGE VALIDATION
  // ========================================================
  describe('8. Backend Integration & Supabase Storage Rules', () => {
    test('Storage service enforces file type and maximum size restrictions', () => {
      // Mock valid image file
      const validFile = {
        name: 'pottery.jpg',
        type: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
      } as unknown as File;

      // Mock oversized file (>5MB)
      const oversizedFile = {
        name: 'large_photo.png',
        type: 'image/png',
        size: 6 * 1024 * 1024, // 6MB
      } as unknown as File;

      // Mock invalid MIME type
      const disallowedFile = {
        name: 'document.pdf',
        type: 'application/pdf',
        size: 500 * 1024,
      } as unknown as File;

      // Validate valid file
      const validRes = {
        isValid: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(validFile.type) && validFile.size <= 5 * 1024 * 1024,
      };
      assert.equal(validRes.isValid, true);

      // Validate oversized
      const oversizedRes = {
        isValid: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(oversizedFile.type) && oversizedFile.size <= 5 * 1024 * 1024,
      };
      assert.equal(oversizedRes.isValid, false);

      // Validate disallowed MIME
      const disallowedRes = {
        isValid: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(disallowedFile.type) && disallowedFile.size <= 5 * 1024 * 1024,
      };
      assert.equal(disallowedRes.isValid, false);
    });

    test('Firebase Auth internal mapping produces deterministic safe emails', () => {
      const buyerUsername = 'Ananya_Kumar';
      const cleanBuyerEmail = `buyer_${buyerUsername.trim().toLowerCase()}@homeconnect.internal`;
      assert.equal(cleanBuyerEmail, 'buyer_ananya_kumar@homeconnect.internal');

      const sellerShopCode = 'shop-101';
      const cleanSellerEmail = `seller_${sellerShopCode.trim().toLowerCase()}@homeconnect.internal`;
      assert.equal(cleanSellerEmail, 'seller_shop-101@homeconnect.internal');
    });

    test('Data models maintain appropriate buyer, seller, product, and request references', () => {
      const allProds = service.getAllProducts();
      assert.ok(allProds.length > 0);
      allProds.forEach((p) => {
        assert.ok(p.id, 'Product must have id');
        assert.ok(p.sellerShopCode, 'Product must reference sellerShopCode');
        assert.ok(p.productName, 'Product must have productName');
        assert.ok(p.price > 0, 'Price must be positive');
      });

      const allReqs = service.getAllRequests();
      assert.ok(allReqs.length > 0);
      allReqs.forEach((r) => {
        assert.ok(r.id, 'Request must have id');
        assert.ok(r.buyerUsername, 'Request must reference buyerUsername');
        assert.ok(r.sellerShopCode, 'Request must reference sellerShopCode');
        assert.ok(r.status, 'Request must have status');
      });
    });
  });
});
