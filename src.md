# **White-Label LMS SaaS — Complete Project Requirements**

The goal is to design and build an LMS platform where multiple academies can independently run their own branded learning websites, admin panels and student portals using one shared application.

I'll base the requirements on our earlier decisions: Next.js, Payload CMS, PostgreSQL, Google Meet, S3 recordings, Razorpay/PhonePe, multi-locale and multi-currency support, and a future React Native app.

Correct project scope

Multi-tenant SaaS

## **1. Project overview**

Build a SaaS platform that allows multiple coaching institutes, academies, training centers and educators to create and operate their own branded LMS.

Each academy gets an independent learning environment, but all academies use the same underlying application and infrastructure.

Example:

**Your LMS SaaS Platform**

Central platform administration

[Шапка выпускника: создать логотип нейросетью онлайн и бесплатно, с примерами дизайна](https://images.openai.com/static-rsc-4/X5FKGgU9r17VLKV-FhTG0yYegO6s6WD64-hndsTfF-STk__Q5jdTEf8qqTha9TVVdMeDFPoYlkKvL9aEnWSaUEldzxAa3-pwsmLjqMmLpME3Cbh3Ud4-X6vqAzOGYP3OnoelbBvcxhy_2D6OCWYy-EBSx9z34m465uENN4Qy7Vg?purpose=inline)

**Academy A**

academy-a.com

Own branding, courses, students, instructors and payments

[Technology education logo Vector Images & Graphics for Commercial Use | VectorStock](https://images.openai.com/static-rsc-4/ayFFEHaGTmD1vDuxR6_Y5PIS4juh0BQUa_lsi6Ikj1GT_p11Gx6MbUSFKfkR8O2I5h2uQC4yG37iulKiew7qggKLwEWN6zJUrrZtXxfOjkAlc8UvtkZ4lGSQCxG_KfvYBrH0JGmeMb4vLm6BzWixJ4ZZ8qUsWtQusQ7eDtpUYR0?purpose=inline)

**Academy B**

academy-b.com

Own branding, courses, students, instructors and payments

**Shared LMS Engine**

Authentication · Courses · Payments · Live Classes · Storage · Notifications

### **Main objectives**

1. Multiple academies can register and create their own LMS.
2. Each academy has its own branded website and admin dashboard.
3. Academy administrators manage instructors, students and courses.
4. Students can purchase courses, attend live classes and watch recordings.
5. Instructors can create courses, lessons, tests and live sessions.
6. Each academy manages its own payments and financial reports.
7. The platform supports multiple languages and currencies.
8. Students can access the platform through web and mobile applications.

## **2. User roles and permissions**

The system must support multiple roles and flexible permissions.

| Role                 | Responsibilities                     |
| -------------------- | ------------------------------------ |
| Platform Super Admin | Manage the entire SaaS               |
| Academy Owner        | Manage their academy                 |
| Academy Admin        | Manage academy operations            |
| Manager              | Manage assigned departments          |
| Instructor           | Manage assigned courses and classes  |
| Student              | Learn, attend classes and take exams |
| Support Staff        | Handle student queries and support   |

### **Important membership architecture**

A user should not have only one global role.

For example:

- User A is an instructor in Academy 1.
- User A is a student in Academy 2.
- User A is an academy admin in Academy 3.

Use a membership relationship:

`User → Academy Membership → Role → Permissions`

Permissions should support scopes:

- `own` — resources created or assigned to the user.
- `team` — resources belonging to the user's team.
- `all` — all resources within that academy.

Platform-level permissions must be separate from academy-level permissions.

## **3. Academy/tenant management**

Every academy must have an independent configuration.

### **Academy registration**

- Academy name.
- Owner name and email.
- Phone number.
- Academy type.
- Country and address.
- Logo and branding.
- Default language.
- Default currency.
- Timezone.
- Initial subdomain.

### **Academy settings**

- Academy name and description.
- Logo, favicon and banner.
- Primary and secondary brand colors.
- Custom domain.
- Website theme.
- Enabled features.
- Supported languages.
- Supported currencies.
- Timezone and regional formatting.
- Payment gateway credentials.
- Email sender configuration.
- Social media links.
- SEO settings.
- Terms and privacy policies.

### **Academy lifecycle**

`pending → active → suspended → cancelled`

The platform administrator can approve, suspend or deactivate an academy.

## **4. White-label website and domain management**

Each academy must have a completely branded website.

Example:

| Academy   | Website                 |
| --------- | ----------------------- |
| Academy A | `academy-a.yourlms.com` |
| Academy B | `academy-b.yourlms.com` |
| Academy C | `learn.example.com`     |

Features:

- Custom domains.
- Automatic SSL provisioning.
- Logo and favicon.
- Theme configuration.
- Homepage builder.
- Header and footer customization.
- Navigation menu management.
- SEO configuration.
- Custom pages.
- Contact forms.
- Course catalog.
- Instructor profiles.
- Testimonials.
- FAQ sections.
- Pricing and packages pages.

### **Page builder**

Use Payload CMS blocks.

Suggested blocks:

- Hero section.
- Image banner.
- Featured courses.
- Course categories.
- Instructor section.
- Course packages.
- Testimonials.
- Statistics.
- FAQ.
- CTA.
- Contact section.
- Video section.

Academy admins should be able to manage website content without writing code.

## **5. Course management**

This is the central module of the LMS.

### **Course types**

- Recorded courses.
- Live courses.
- Hybrid courses.
- Free courses.
- Paid courses.

### **Course fields**

- Course title.
- Slug.
- Short description.
- Detailed description.
- Thumbnail.
- Promotional video.
- Category.
- Instructor.
- Difficulty level.
- Language.
- Duration.
- Price.
- Discount.
- Learning objectives.
- Requirements.
- Course outcomes.
- SEO information.
- Publication status.

### **Course structure**

**Course: Full Stack Development**

1. **Module 1 — Introduction**
   - Lesson 1: Introduction to Web Development
   - Lesson 2: HTML Fundamentals
   - Lesson 3: CSS Fundamentals
2. **Module 2 — JavaScript**
   - Lesson 1: Variables
   - Lesson 2: Functions
   - Lesson 3: DOM Manipulation
3. **Module 3 — React**
   - Lesson 1: Components
   - Lesson 2: Hooks
   - Lesson 3: State Management
4. **Module 4 — Final Assessment**
   - Quiz
   - Assignment
   - Final examination

### **Lesson types**

- Video.
- Live session.
- Text/article.
- PDF/document.
- Downloadable resources.
- Quiz.
- Assignment.
- External link.

### **Course access**

- Lifetime access.
- Time-limited access.
- Batch-based access.
- Subscription-based access.
- Drip content.
- Prerequisite lessons.
- Completion-based unlocking.

## **6. Course packages and bundles**

Academies must be able to sell individual courses or combinations of courses.

Example:

| Package  | Includes              | Price  |
| -------- | --------------------- | ------ |
| Basic    | Mathematics           | ₹999   |
| Standard | Mathematics + Science | ₹1,799 |
| Premium  | All subjects          | ₹2,999 |

Features:

- Create packages.
- Add multiple courses.
- Set package price.
- Set discount.
- Define package validity.
- Set enrollment limits.
- Schedule package availability.
- Configure package access expiration.

A package should not duplicate course content. It should reference the courses it contains.

## **7. Instructor management**

Academy admins should be able to:

- Invite instructors.
- Approve instructor applications.
- Assign courses.
- Assign batches.
- Manage instructor profiles.
- View instructor activity.
- Track student progress.
- View assigned live sessions.

Instructors should be able to:

- Create and edit assigned courses.
- Add lessons.
- Upload videos and resources.
- Create quizzes.
- Schedule live sessions.
- Review assignments.
- View enrolled students.
- Track course completion.

## **8. Student management**

### **Student onboarding**

- Registration through email and password.
- Google login.
- Phone verification (optional).
- Student profile.
- Profile photo.
- Address and contact details.
- Preferred language.
- Preferred currency.

### **Student dashboard**

- Enrolled courses.
- Purchased packages.
- Continue learning.
- Course progress.
- Upcoming live classes.
- Completed lessons.
- Pending assignments.
- Quiz results.
- Certificates.
- Payment history.
- Notifications.

### **Student features**

- Watch recorded lessons.
- Attend live classes.
- Download permitted materials.
- Submit assignments.
- Take quizzes and examinations.
- Ask questions.
- Review courses.
- Download certificates.

## **9. Live class management — Google Meet**

Google Meet integration is a major part of the system.

### **Requirements**

- Connect academy's Google account.
- Create live class schedules.
- Assign instructors.
- Select enrolled batches or students.
- Generate Google Meet links.
- Display upcoming sessions.
- Send reminders.
- Track attendance.
- Retrieve recordings.
- Store recording metadata.
- Provide recording access to enrolled students.

### **Live class workflow**

1. Instructor creates a live class.
2. Selects course and batch.
3. Sets date, start time and duration.
4. Backend creates a Google Meet space.
5. Students receive notifications.
6. Students join using the Meet link.
7. Attendance data is retrieved where available.
8. Recording becomes available in Google Drive.
9. Background job retrieves the recording.
10. Recording is copied to S3.
11. Student can watch it through the LMS.

### **Recording statuses**

`scheduled → live → processing → ready`

Additional statuses:

- Failed.
- Cancelled.
- Recording unavailable.

**Important:** Google Meet recordings are not necessarily available immediately after a session. Recording access also depends on the organizer's Google Workspace permissions and policies. Use background jobs to check for completed recordings rather than assuming an immediate download.

## **10. Video and file management**

Use AWS S3 for permanent file storage.

### **Storage requirements**

- Course videos.
- Live class recordings.
- Course thumbnails.
- Instructor profile images.
- PDFs and notes.
- Assignments.
- Certificates.

### **Video delivery**

Recommended architecture:

**Instructor uploads video**

**S3 storage**

**Video processing / transcoding**

**CloudFront CDN**

**Student video player**

Requirements:

- Private video storage.
- Signed playback URLs or secure tokenized access.
- Video quality variants.
- Resume playback.
- Track watch progress.
- Restrict access to enrolled students.
- Control downloading.
- Video metadata and processing status.

Do not expose permanent S3 object URLs for protected course content.

## **11. Quiz, examination and assignment management**

### **Quiz management**

- Create quizzes.
- Add questions.
- Multiple-choice questions.
- Multiple-select questions.
- True/false questions.
- Short-answer questions.
- Descriptive questions.
- Marks per question.
- Negative marking.
- Time limits.
- Passing percentage.
- Randomized questions.
- Question banks.

### **Examination**

- Exam scheduling.
- Start and end time.
- Attempt limits.
- Auto-submit.
- Automatic evaluation for objective questions.
- Manual evaluation for descriptive answers.
- Results and score reports.

### **Assignment management**

- Create assignments.
- Set deadlines.
- Upload instructions.
- Student file submission.
- Instructor feedback.
- Marks and grading.

## **12. Certificate management**

Generate certificates automatically when students satisfy course requirements.

Features:

- Certificate templates.
- Academy branding.
- Student name.
- Course name.
- Instructor name.
- Completion date.
- Certificate number.
- QR code.
- Public certificate verification URL.
- PDF download.

Example:

`academy-a.com/verify/certificate/ABC123`

Certificate verification should work without exposing private student information.

## **13. Payment and subscription management**

There are two separate payment systems.

### **A. Student payments**

Each academy configures its own payment gateway.

Initial providers:

- Razorpay.
- PhonePe Payment Gateway.
- Free/manual enrollment.
- Optional cash or offline payment records.

Features:

- Course purchase.
- Package purchase.
- Payment verification.
- Webhook processing.
- Refunds.
- Failed payment recovery.
- Invoices.
- Transaction history.
- Payment status.

### **B. SaaS subscription payments**

Your platform charges academies for using the LMS.

Example:

| Plan       | Monthly price | Features                       |
| ---------- | ------------- | ------------------------------ |
| Starter    | ₹999          | Limited students and courses   |
| Growth     | ₹2,999        | More students and storage      |
| Pro        | ₹5,999        | Advanced features and branding |
| Enterprise | Custom        | Custom limits and integrations |

Features:

- Subscription plans.
- Monthly/yearly billing.
- Trial periods.
- Feature limits.
- Usage tracking.
- Subscription renewal.
- Payment failure handling.
- Plan upgrades and downgrades.
- Suspension on non-payment.

Keep academy subscriptions separate from student course purchases.

Also, don't assume every academy's merchant account can accept every currency. Gateway capabilities depend on merchant country, settlement arrangements and provider support.

## **14. Multi-locale and multi-currency**

These are foundational requirements.

### **Locale**

Three levels:

1. Platform-supported locales.
2. Academy-enabled locales.
3. User-preferred locale.

Example:

| Academy   | Default | Enabled         |
| --------- | ------- | --------------- |
| Academy A | English | English, Hindi  |
| Academy B | Hindi   | Hindi, English  |
| Academy C | Arabic  | Arabic, English |

Localize:

- Website content.
- Dashboard interface.
- Courses and lessons.
- Quizzes and questions.
- Emails.
- Notifications.
- Certificates.
- SEO metadata.
- URLs and slugs.

Use `next-intl` for Next.js interface localization.

Use Payload's localization capabilities for localized CMS content, with tenant-aware locale availability.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://payloadcms.com&sz=32)

Payload+1

### **Currency**

Each academy can configure:

- Default currency.
- Supported currencies.
- Localized course prices.
- Package prices.
- Exchange rates.
- Currency formatting.
- Payment currency.

Example:

| Academy       | Currency |
| ------------- | -------- |
| India Academy | INR      |
| USA Academy   | USD      |
| UAE Academy   | AED      |

Use integer minor units for monetary values and preserve the original currency and amount in every payment transaction.

## **15. Website CMS**

Academy administrators should manage their own public website.

Collections/content types:

- Pages.
- Navigation menus.
- Banners.
- Testimonials.
- FAQs.
- Instructors.
- Course categories.
- Contact information.
- Footer settings.
- SEO settings.
- Theme settings.

Payload CMS should handle content management, while Next.js renders the websites.

## **16. Notification system**

Support:

- Email notifications.
- In-app notifications.
- Push notifications later.
- Optional SMS/WhatsApp integration later.

Events:

- Student registration.
- Enrollment confirmation.
- Payment success/failure.
- New course published.
- New lesson available.
- Live class reminder.
- Assignment deadline.
- Exam result.
- Certificate generated.
- Subscription expiry.

Academies should be able to customize notification templates and branding.

## **17. Admin dashboards**

### **Platform super-admin dashboard**

- Total academies.
- Active and suspended academies.
- Total students.
- Total instructors.
- Total courses.
- Platform subscription revenue.
- Storage usage.
- Platform activity.
- Failed jobs and integration status.

### **Academy admin dashboard**

- Total students.
- Total instructors.
- Total courses.
- Active enrollments.
- Course revenue.
- Upcoming live classes.
- Course completion.
- Student activity.
- Payment reports.

### **Instructor dashboard**

- Assigned courses.
- Enrolled students.
- Upcoming classes.
- Pending assignments.
- Student performance.
- Course progress.

### **Student dashboard**

- My courses.
- Continue learning.
- Upcoming live classes.
- Learning progress.
- Exams and assignments.
- Certificates.

## **18. Database architecture**

Use PostgreSQL as the main database.

Recommended logical collections/tables:

| Module         | Collections / Tables                              |
| -------------- | ------------------------------------------------- |
| Tenancy        | tenants, domains, tenant-settings                 |
| Authentication | users, memberships, invitations                   |
| Permissions    | roles, permissions, role-permissions              |
| SaaS billing   | plans, subscriptions, subscription-invoices       |
| Courses        | courses, course-translations, categories          |
| Content        | modules, lessons, lesson-translations, resources  |
| Packages       | packages, package-courses                         |
| Enrollment     | enrollments, enrollment-items                     |
| Live classes   | live-classes, meet-integrations, attendance       |
| Recordings     | recordings, recording-jobs                        |
| Tests          | quizzes, questions, question-options              |
| Exams          | exams, exam-attempts, answers                     |
| Assignments    | assignments, submissions, grading                 |
| Certificates   | certificates, certificate-templates               |
| Payments       | payment-gateways, payments, refunds               |
| Storage        | media, video-assets                               |
| Website        | pages, menus, banners, testimonials               |
| Localization   | tenant-locales, tenant-currencies, exchange-rates |
| Notifications  | notifications, email-templates                    |
| Reporting      | audit-logs, activity-logs                         |

### **Important relationships**

```
Tenant
 ├── Domains
 ├── Settings
 ├── Memberships
 │    ├── User
 │    └── Role
 ├── Courses
 │    ├── Modules
 │    │    └── Lessons
 │    └── Instructors
 ├── Packages
 │    └── Package Courses
 ├── Batches
 │    └── Live Classes
 ├── Students
 │    └── Enrollments
 ├── Payments
 ├── Certificates
 └── Website Content
```

### **Multi-tenancy rules**

- Every academy-owned resource must be tenant-scoped.
- A user can belong to multiple academies.
- A user can have different roles in different academies.
- Platform administrators have explicitly authorized global access.
- Tenant IDs from frontend requests cannot establish authorization.
- Background jobs must carry and validate tenant context.
- Cross-tenant access must be tested, not just assumed.

Payload provides an official multi-tenant plugin that adds tenant relationships, tenant-aware admin filtering and write enforcement. It can help with the CMS layer, but your custom services and frontend still need proper tenant resolution and authorization.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://payloadcms.com&sz=32)

Payload+1

## **19. Recommended technology stack**

| Layer           | Technology                       |
| --------------- | -------------------------------- |
| Web application | Next.js 16                       |
| UI              | Tailwind CSS + shadcn/ui         |
| CMS/backend     | Payload CMS 3                    |
| Database        | PostgreSQL                       |
| Authentication  | Payload Auth                     |
| Authorization   | Custom RBAC + tenant membership  |
| Data fetching   | React Query                      |
| UI state        | Zustand                          |
| Forms           | React Hook Form + Zod            |
| API requests    | Axios                            |
| Localization    | next-intl + Payload localization |
| Background jobs | Redis + BullMQ                   |
| Video storage   | AWS S3                           |
| Video delivery  | CloudFront                       |
| Live classes    | Google Meet API                  |
| Payments        | Razorpay + PhonePe               |
| Mobile          | React Native                     |
| Email           | Resend / SMTP                    |
| Validation      | Zod                              |
| Deployment      | VPS / AWS                        |

**Architecture:** Modular monolith first. Keep the business logic separated into modules rather than splitting into microservices prematurely.

For the mobile app, start with an API-first backend. A PWA or WebView can be the first mobile delivery option, with React Native as a later full implementation.

## **20. Suggested project structure**

```
src/
├── app/
│   ├── (platform)/
│   │   └── admin/
│   ├── (academy)/
│   │   └── dashboard/
│   ├── (student)/
│   │   └── learning/
│   ├── (instructor)/
│   │   └── instructor/
│   ├── (website)/
│   └── api/
│
├── collections/
│   ├── Tenants.ts
│   ├── Users.ts
│   ├── Memberships.ts
│   ├── Roles.ts
│   ├── Courses.ts
│   ├── Lessons.ts
│   ├── Packages.ts
│   ├── Enrollments.ts
│   ├── LiveClasses.ts
│   ├── Payments.ts
│   └── ...
│
├── modules/
│   ├── tenancy/
│   ├── auth/
│   ├── permissions/
│   ├── courses/
│   ├── lessons/
│   ├── packages/
│   ├── enrollments/
│   ├── live-classes/
│   ├── recordings/
│   ├── examinations/
│   ├── certificates/
│   ├── payments/
│   ├── subscriptions/
│   ├── localization/
│   ├── storage/
│   └── notifications/
│
├── components/
├── hooks/
├── lib/
├── services/
└── payload.config.ts
```

## **21. Development roadmap**

Build this in phases rather than attempting the complete LMS immediately.

Phase 1

**Multi-tenant foundation**

- Authentication
- Tenants and domains
- Memberships
- Dynamic RBAC
- Tenant settings
- Tenant isolation tests

Phase 2

**Academy website and CMS**

- White-label branding
- Custom domains
- Page builder
- Menus and banners
- Multi-locale website

Phase 3

**Learning management**

- Course management
- Modules and lessons
- Instructor onboarding
- Student onboarding
- Packages and bundles
- Enrollment management

Phase 4

**Payments and learning**

- Course checkout
- Razorpay
- PhonePe
- Student dashboard
- Video player
- Learning progress

Phase 5

**Live learning**

- Google Meet integration
- Class scheduling
- Attendance
- Recording synchronization
- S3 and CloudFront

Phase 6

**Assessment and certification**

- Quizzes
- Exams
- Assignments
- Results
- Certificates

Phase 7

**SaaS and mobile**

- Academy subscription plans
- Feature limits
- Usage tracking
- React Native app
- Push notifications
- Advanced reporting

## **22. MVP acceptance criteria**

The first release should be considered complete when:

- Two independent academies can register.
- Each academy gets its own branded website.
- Each academy can use its own domain or subdomain.
- Each academy has isolated users, roles and permissions.
- Academy admins can create courses and packages.
- Instructors can manage assigned courses.
- Students can register and enroll.
- Students can purchase courses.
- Students can watch recorded lessons.
- Students can track learning progress.
- Academies can schedule Google Meet classes.
- Recordings can be synchronized to S3.
- Quizzes and certificates work.
- Each academy can configure its own payment gateway.
- Multiple languages and currencies work.
- Cross-tenant data access tests pass.

## **23. Features to postpone**

Don't put these into the first milestone:

- AI teaching assistant.
- AI course generation.
- AI question generation.
- Advanced proctoring.
- Complex affiliate systems.
- Live streaming infrastructure built from scratch.
- Native offline video downloads.
- Microservices.
- Advanced analytics and data warehouse.
- Multi-region infrastructure.

These add significant complexity without proving the foundational multi-tenant LMS architecture.

## **24. Important implementation decisions**

I would lock these decisions before coding:

| Decision         | Recommendation                                      |
| ---------------- | --------------------------------------------------- |
| Tenant model     | One academy = one tenant                            |
| Database         | Shared PostgreSQL initially                         |
| CMS              | Payload CMS 3                                       |
| Tenant isolation | Tenant-scoped access + custom service authorization |
| User model       | Global users + academy memberships                  |
| Roles            | Dynamic roles and permissions                       |
| Domains          | Subdomain and custom domain                         |
| Course model     | Courses → Modules → Lessons                         |
| Packages         | Many-to-many course relationships                   |
| Enrollment       | Individual course, package, batch and subscription  |
| Live classes     | Google Meet integration                             |
| Recordings       | Google Drive → background job → S3                  |
| Video delivery   | CloudFront                                          |
| Payments         | Academy-specific gateway credentials                |
| SaaS billing     | Separate academy subscription system                |
| Localization     | Independent academy locale configuration            |
| Currency         | Localized prices with currency-specific storage     |
| Mobile           | API-first, then React Native                        |

One caveat: the ₹5,000–₹8,000/month maintenance target we discussed should be treated as a limited maintenance budget, not a guarantee that all AWS storage, video delivery, Google Workspace, SMS, email and payment-related costs fit within it.

## **25. Reference implementation**

Payload has an official example combining multi-tenancy and localization in a single Next.js application. It demonstrates multiple academy-like tenants on different subdomains and localized routes.

[image](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

[**Payload localized multi-tenant example**](https://github.com/payloadcms/localized-multitenant?utm_source=chatgpt.com)

[image](https://www.google.com/s2/favicons?domain=https://payloadcms.com&sz=32)

[**Payload Multi-Tenant documentation**](https://payloadcms.com/docs/plugins/multi-tenant?utm_source=chatgpt.com)

These are useful starting references, but they don't implement the complete LMS business logic.

**My recommendation:** Build this as a reusable SaaS foundation, not just a course management website. The hardest and most valuable parts to get right are tenant isolation, membership-based RBAC, domain resolution, academy-specific configuration, and transactional enrollment/payment workflows.

The first implementation milestone should be **Phase 1: Multi-tenant foundation**, before building courses or the student dashboard.
