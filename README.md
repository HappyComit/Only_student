# 🎓 OnlyStudents
### The Campus Freelance Marketplace

**Hire talented students. Sell your skills. Build your college portfolio.**

OnlyStudents is a student-exclusive freelance marketplace that connects university students offering services with students looking to hire them.

Think of it as **Fiverr for your campus** — a platform where students can showcase their skills, earn money, and collaborate with other talented students.

---

## 📖 About the Project

OnlyStudents aims to create a dedicated freelancing ecosystem within universities, allowing students to monetize their skills and find affordable services within their campus.

The platform currently serves Chandigarh University students through university email-based registration (`@cuchd.in`).

## ✨ Features

- **Student Marketplace:** Browse, search, and post freelance services across categories like development, design, photography, video editing, and writing.
- **Real-Time Chat:** One-to-one messaging between buyers and sellers using Socket.IO.
- **Secure Payments:** Razorpay integration with payment verification and booking fee management.
- **Order Management:** Complete order lifecycle with seller acceptance, delivery tracking, and cancellation.
- **Reviews & Ratings:** Five-star rating system to build seller credibility.
- **Notifications:** Real-time alerts for messages, orders, and platform updates.
- **Admin Dashboard:** Manage users, verify freelancers, and monitor platform activity.
- **Authentication:** University email-based registration, JWT authentication, password hashing, and OTP-based password reset.
- **Campus Community:** Student communities, campus events, and seller earnings analytics.

## 🛠 Tech Stack

| Category | Technologies |
|---|---|
| Mobile App | React Native, Expo, TypeScript |
| Navigation | Expo Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Supabase |
| ORM | Prisma |
| Real-Time Communication | Socket.IO |
| Authentication | JWT, bcryptjs |
| Payments | Razorpay |
| Email Services | Nodemailer |
| Storage | Supabase Storage |

## 🏗 Project Architecture

The project consists of two main applications:

**1. CampusHive – Mobile Application**
- Built using React Native and Expo.
- Handles user authentication, marketplace browsing, orders, messaging, communities, and events.
- Provides separate experiences for buyers and sellers.

**2. Backend – API Server**
- Built using Node.js and Express.js.
- Handles authentication, marketplace operations, order management, payments, and notifications.
- Uses Prisma ORM with PostgreSQL for database management.
- Integrates Socket.IO for real-time communication.

## 🗄 Core Database Models

The application uses six primary database models:

- **User:** Student profiles and account information.
- **Gig:** Freelance services listed by students.
- **Order:** Hiring transactions and order status.
- **Message:** Buyer-seller conversations.
- **Review:** Ratings and feedback.
- **Notification:** User notifications and activity alerts.

---

<p align="center">

**Built with ❤️ by Team HappyComit**

*OnlyStudents — Where Campus Talent Meets Opportunity.*

</p>
