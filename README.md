# api-booking

A RESTful API for managing appointment bookings between clients and service providers, built with **Node.js**, **Express**, and **PostgreSQL**.

---

## Features

- User authentication with JWT (login/register)
- Role-based access (client / provider)
- Time slot creation by providers
- Appointment booking by clients
- View and cancel appointments
- Protected routes with middleware
- PostgreSQL integration
- API documentation with Swagger
- Unit tests with Node's test runner & Supertest

## Installation dependencies
- npm install

## Database setup
- createdb api_booking
- createdb api_booking_test

## running the app
- in development: npm run dev
- in production: npm start

## project structure 

├── bin/
│ └── www # Entry point
├── config/
│ └── db.js # PostgreSQL connection configuration
├── controllers/
│ ├── appointmentController.js
│ ├── authController.js
│ └── timeslotController.js
├── middlewares/
│ └── authmiddleware.js # JWT authentication middleware
├── utils/
│ └── logger.js
├── routes/
│ └── appointmentRoutes.js
  └── authRoutes.js
  └── index.js
  └── slots.js
  └── users.js
├── tests/
│ └── appointment.test.js
├── swaggerConfig.js
├── app.js # Express application setup
├── .env # Environment variables
├── package.json
└── README.md