# Cấu trúc thư mục dự án

> Liệt kê từ `git ls-files` (đã loại các file trong `.gitignore` như `target/`, `node_modules/`, `.idea/`, `.env`). Các thư mục chỉ có một nhánh con được gộp thành một dòng (vd. `src/main/java/com/bake2b/...`).

```
MSS301-moonkage-platform-project/
├── .githooks/
│   └── pre-commit
├── .github/
│   └── workflows/
│       └── code-quality.yml
├── backend/
│   ├── .mvn/
│   │   ├── wrapper/
│   │   │   └── maven-wrapper.properties
│   │   └── jvm.config
│   ├── api-gateway/
│   │   ├── src/main/
│   │   │   ├── java/com/bake2b/gateway/
│   │   │   │   ├── config/
│   │   │   │   │   ├── DotEnvConfig.java
│   │   │   │   │   └── SecurityConfig.java
│   │   │   │   └── ApiGatewayApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── catalog-service/
│   │   ├── src/main/
│   │   │   ├── java/com/bake2b/catalog/
│   │   │   │   ├── client/
│   │   │   │   │   └── IdentityClient.java
│   │   │   │   ├── common/
│   │   │   │   │   └── exception/
│   │   │   │   │       ├── CustomException.java
│   │   │   │   │       ├── ErrorResponse.java
│   │   │   │   │       └── GlobalExceptionHandler.java
│   │   │   │   ├── config/
│   │   │   │   │   ├── DotEnvConfig.java
│   │   │   │   │   └── OpenApiConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── DeliveryAreaController.java
│   │   │   │   │   ├── OrderProfileController.java
│   │   │   │   │   ├── ProductController.java
│   │   │   │   │   ├── ReviewController.java
│   │   │   │   │   └── SellerProductController.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── client/
│   │   │   │   │   │   └── VendorInfo.java
│   │   │   │   │   ├── request/
│   │   │   │   │   │   ├── CreateProductRequest.java
│   │   │   │   │   │   ├── PriceTierRequest.java
│   │   │   │   │   │   └── UpdateProductRequest.java
│   │   │   │   │   ├── response/
│   │   │   │   │   │   ├── PageResponse.java
│   │   │   │   │   │   ├── PriceTierResponse.java
│   │   │   │   │   │   └── ProductResponse.java
│   │   │   │   │   └── package-info.java
│   │   │   │   ├── entity/
│   │   │   │   │   ├── AuditLog.java
│   │   │   │   │   ├── DeliveryArea.java
│   │   │   │   │   ├── OrderProfile.java
│   │   │   │   │   ├── Product.java
│   │   │   │   │   ├── ProductPriceTier.java
│   │   │   │   │   ├── RefPriceTier.java
│   │   │   │   │   └── Review.java
│   │   │   │   ├── enums/
│   │   │   │   │   ├── CustomType.java
│   │   │   │   │   ├── DeliveryLabel.java
│   │   │   │   │   └── ProductStatus.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── AuditLogRepository.java
│   │   │   │   │   ├── DeliveryAreaRepository.java
│   │   │   │   │   ├── OrderProfileRepository.java
│   │   │   │   │   ├── ProductPriceTierRepository.java
│   │   │   │   │   ├── ProductRepository.java
│   │   │   │   │   ├── RefPriceTierRepository.java
│   │   │   │   │   └── ReviewRepository.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── impl/
│   │   │   │   │   │   ├── DeliveryAreaServiceImpl.java
│   │   │   │   │   │   ├── OrderProfileServiceImpl.java
│   │   │   │   │   │   ├── ProductServiceImpl.java
│   │   │   │   │   │   └── ReviewServiceImpl.java
│   │   │   │   │   ├── DeliveryAreaService.java
│   │   │   │   │   ├── OrderProfileService.java
│   │   │   │   │   ├── ProductService.java
│   │   │   │   │   └── ReviewService.java
│   │   │   │   └── CatalogServiceApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── config/
│   │   └── checkstyle/
│   │       └── checkstyle.xml
│   ├── discovery-server/
│   │   ├── src/main/
│   │   │   ├── java/com/bake2b/discovery/
│   │   │   │   └── DiscoveryServerApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── docs/
│   │   └── t0-t1-automation.md
│   ├── file-service/
│   │   ├── src/main/
│   │   │   ├── java/com/bake2b/file/
│   │   │   │   ├── config/
│   │   │   │   │   ├── DotEnvConfig.java
│   │   │   │   │   ├── MinIOConfig.java
│   │   │   │   │   └── OpenApiConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   └── FileController.java
│   │   │   │   ├── dto/
│   │   │   │   │   └── FileUploadResponse.java
│   │   │   │   ├── enums/
│   │   │   │   │   └── FileFolder.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── impl/
│   │   │   │   │   │   └── FileServiceImpl.java
│   │   │   │   │   └── FileService.java
│   │   │   │   └── FileServiceApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── identity-service/
│   │   ├── docs/
│   │   │   └── directory-structure.md
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/com/bake2b/identity/
│   │   │   │   │   ├── common/
│   │   │   │   │   │   └── exception/
│   │   │   │   │   │       ├── CustomException.java
│   │   │   │   │   │       ├── EmailAlreadyExistsException.java
│   │   │   │   │   │       ├── GlobalExceptionHandler.java
│   │   │   │   │   │       └── InvalidCredentialsException.java
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── DataInitializer.java
│   │   │   │   │   │   ├── DotEnvConfig.java
│   │   │   │   │   │   ├── OpenApiConfig.java
│   │   │   │   │   │   └── WebMvcConfig.java
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   ├── AddressController.java
│   │   │   │   │   │   ├── AuthController.java
│   │   │   │   │   │   ├── InternalVendorController.java
│   │   │   │   │   │   └── VendorController.java
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── request/
│   │   │   │   │   │   │   ├── AccountCreateRequest.java
│   │   │   │   │   │   │   ├── ForgotPasswordRequest.java
│   │   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   │   ├── RefreshTokenRequest.java
│   │   │   │   │   │   │   ├── ResetPasswordRequest.java
│   │   │   │   │   │   │   └── VerifyRequest.java
│   │   │   │   │   │   └── response/
│   │   │   │   │   │       ├── AccountCreateResponse.java
│   │   │   │   │   │       ├── ErrorResponse.java
│   │   │   │   │   │       ├── LoginResponse.java
│   │   │   │   │   │       └── VendorInternalResponse.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   ├── Account.java
│   │   │   │   │   │   ├── Address.java
│   │   │   │   │   │   ├── AuditLog.java
│   │   │   │   │   │   ├── BankAccount.java
│   │   │   │   │   │   ├── BaseEntity.java
│   │   │   │   │   │   ├── Role.java
│   │   │   │   │   │   ├── User.java
│   │   │   │   │   │   ├── Vendor.java
│   │   │   │   │   │   └── VendorDocument.java
│   │   │   │   │   ├── enums/
│   │   │   │   │   │   ├── AccountStatus.java
│   │   │   │   │   │   ├── SupplySource.java
│   │   │   │   │   │   ├── VendorDocumentType.java
│   │   │   │   │   │   ├── VendorEntityType.java
│   │   │   │   │   │   └── VendorStatus.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── AccountRepository.java
│   │   │   │   │   │   ├── AddressRepository.java
│   │   │   │   │   │   ├── AuditLogRepository.java
│   │   │   │   │   │   ├── RoleRepository.java
│   │   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   │   ├── VendorDocumentRepository.java
│   │   │   │   │   │   └── VendorRepository.java
│   │   │   │   │   ├── security/
│   │   │   │   │   │   ├── CurrentUser.java
│   │   │   │   │   │   ├── CurrentUserArgumentResolver.java
│   │   │   │   │   │   ├── CurrentUserInfo.java
│   │   │   │   │   │   ├── JwtFilter.java
│   │   │   │   │   │   └── SecurityConfig.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── impl/
│   │   │   │   │   │   │   ├── AddressServiceImpl.java
│   │   │   │   │   │   │   ├── AuthServiceImpl.java
│   │   │   │   │   │   │   ├── EmailServiceImpl.java
│   │   │   │   │   │   │   ├── TokenServiceImpl.java
│   │   │   │   │   │   │   └── VendorServiceImpl.java
│   │   │   │   │   │   ├── AddressService.java
│   │   │   │   │   │   ├── AuthService.java
│   │   │   │   │   │   ├── EmailService.java
│   │   │   │   │   │   ├── TokenService.java
│   │   │   │   │   │   └── VendorService.java
│   │   │   │   │   └── IdentityServiceApplication.java
│   │   │   │   └── resources/
│   │   │   │       ├── templates/
│   │   │   │       │   ├── FORGOT_PASSWORD.html
│   │   │   │       │   └── REGISTRATION.html
│   │   │   │       └── application.yml
│   │   │   └── test/java/com/bake2b/identity/
│   │   │       └── service/impl/
│   │   │           └── EmailServiceImplTest.java
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── order-service/
│   │   ├── src/main/
│   │   │   ├── java/com/bake2b/order/
│   │   │   │   ├── client/
│   │   │   │   │   ├── CatalogClient.java
│   │   │   │   │   ├── IdentityClient.java
│   │   │   │   │   └── TenderClient.java
│   │   │   │   ├── config/
│   │   │   │   │   ├── DotEnvConfig.java
│   │   │   │   │   └── OpenApiConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── CartController.java
│   │   │   │   │   ├── CommissionController.java
│   │   │   │   │   ├── DisputeController.java
│   │   │   │   │   ├── OrderController.java
│   │   │   │   │   ├── SettlementController.java
│   │   │   │   │   └── VoucherController.java
│   │   │   │   ├── dto/
│   │   │   │   │   └── package-info.java
│   │   │   │   ├── entity/
│   │   │   │   │   ├── AuditLog.java
│   │   │   │   │   ├── CartItem.java
│   │   │   │   │   ├── CommissionConfig.java
│   │   │   │   │   ├── CommissionInvoice.java
│   │   │   │   │   ├── DisbursementRequest.java
│   │   │   │   │   ├── Dispute.java
│   │   │   │   │   ├── DisputeEvidence.java
│   │   │   │   │   ├── InvoiceInfo.java
│   │   │   │   │   ├── Ledger.java
│   │   │   │   │   ├── MockupVersion.java
│   │   │   │   │   ├── Order.java
│   │   │   │   │   ├── OrderItem.java
│   │   │   │   │   ├── Payment.java
│   │   │   │   │   ├── ProgressUpdate.java
│   │   │   │   │   └── Voucher.java
│   │   │   │   ├── enums/
│   │   │   │   │   ├── DisbursementPurpose.java
│   │   │   │   │   ├── DisbursementStatus.java
│   │   │   │   │   ├── DisputeDecision.java
│   │   │   │   │   ├── DisputeParty.java
│   │   │   │   │   ├── DisputeReason.java
│   │   │   │   │   ├── DisputeStatus.java
│   │   │   │   │   ├── MockupReviewStatus.java
│   │   │   │   │   ├── OrderKind.java
│   │   │   │   │   ├── OrderStatus.java
│   │   │   │   │   ├── PaymentStatus.java
│   │   │   │   │   └── PaymentType.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── AuditLogRepository.java
│   │   │   │   │   ├── CartItemRepository.java
│   │   │   │   │   ├── CommissionConfigRepository.java
│   │   │   │   │   ├── CommissionInvoiceRepository.java
│   │   │   │   │   ├── DisbursementRequestRepository.java
│   │   │   │   │   ├── DisputeEvidenceRepository.java
│   │   │   │   │   ├── DisputeRepository.java
│   │   │   │   │   ├── LedgerRepository.java
│   │   │   │   │   ├── MockupVersionRepository.java
│   │   │   │   │   ├── OrderItemRepository.java
│   │   │   │   │   ├── OrderRepository.java
│   │   │   │   │   ├── PaymentRepository.java
│   │   │   │   │   ├── ProgressUpdateRepository.java
│   │   │   │   │   └── VoucherRepository.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── impl/
│   │   │   │   │   │   ├── CartServiceImpl.java
│   │   │   │   │   │   ├── CommissionServiceImpl.java
│   │   │   │   │   │   ├── DisputeServiceImpl.java
│   │   │   │   │   │   ├── OrderServiceImpl.java
│   │   │   │   │   │   ├── SettlementServiceImpl.java
│   │   │   │   │   │   └── VoucherServiceImpl.java
│   │   │   │   │   ├── CartService.java
│   │   │   │   │   ├── CommissionService.java
│   │   │   │   │   ├── DisputeService.java
│   │   │   │   │   ├── OrderService.java
│   │   │   │   │   ├── SettlementService.java
│   │   │   │   │   └── VoucherService.java
│   │   │   │   └── OrderServiceApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── tender-service/
│   │   ├── src/main/
│   │   │   ├── java/com/bake2b/tender/
│   │   │   │   ├── client/
│   │   │   │   │   ├── CatalogClient.java
│   │   │   │   │   └── IdentityClient.java
│   │   │   │   ├── config/
│   │   │   │   │   ├── DotEnvConfig.java
│   │   │   │   │   └── OpenApiConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── QuoteController.java
│   │   │   │   │   ├── SeasonController.java
│   │   │   │   │   └── TenderRequestController.java
│   │   │   │   ├── dto/
│   │   │   │   │   └── package-info.java
│   │   │   │   ├── entity/
│   │   │   │   │   ├── AuditLog.java
│   │   │   │   │   ├── Quote.java
│   │   │   │   │   ├── Season.java
│   │   │   │   │   ├── TenderInvitation.java
│   │   │   │   │   └── TenderRequest.java
│   │   │   │   ├── enums/
│   │   │   │   │   ├── CustomType.java
│   │   │   │   │   ├── InvitationStatus.java
│   │   │   │   │   ├── QuoteStatus.java
│   │   │   │   │   ├── RequestStatus.java
│   │   │   │   │   └── RequestType.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── AuditLogRepository.java
│   │   │   │   │   ├── QuoteRepository.java
│   │   │   │   │   ├── SeasonRepository.java
│   │   │   │   │   ├── TenderInvitationRepository.java
│   │   │   │   │   └── TenderRequestRepository.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── impl/
│   │   │   │   │   │   ├── QuoteServiceImpl.java
│   │   │   │   │   │   ├── SeasonServiceImpl.java
│   │   │   │   │   │   └── TenderRequestServiceImpl.java
│   │   │   │   │   ├── QuoteService.java
│   │   │   │   │   ├── SeasonService.java
│   │   │   │   │   └── TenderRequestService.java
│   │   │   │   └── TenderServiceApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── .dockerignore
│   ├── mvnw
│   ├── mvnw.cmd
│   └── pom.xml
├── docs/
│   ├── auth.md
│   ├── conceptual-erd.puml
│   ├── Moonkage Context Final.md
│   ├── MoonKage-Auth.postman_collection.json
│   ├── Moonkage_Requirement_v1.3.md
│   ├── Moonkage_User_Stories.md
│   └── Software_Design_v0.4.md
├── frontend/
│   └── web-portal/
│       ├── public/
│       │   ├── favicon.svg
│       │   └── icons.svg
│       ├── src/
│       │   ├── assets/
│       │   │   ├── hero.png
│       │   │   ├── react.svg
│       │   │   └── vite.svg
│       │   ├── App.css
│       │   ├── App.tsx
│       │   ├── index.css
│       │   └── main.tsx
│       ├── .gitignore
│       ├── .oxlintrc.json
│       ├── index.html
│       ├── package-lock.json
│       ├── package.json
│       ├── README.md
│       ├── tsconfig.app.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       └── vite.config.ts
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── docker-compose.yml
├── GEMINI.md
└── README.md
```

## Tổng quan

- **backend/**: dự án Maven nhiều module gồm 7 service: `api-gateway`, `discovery-server`, `identity-service`, `catalog-service`, `file-service`, `order-service`, `tender-service`.
- **frontend/web-portal/**: React + Vite + TypeScript.
- **docs/**: requirement, user stories, software design, ERD, Postman collection.
