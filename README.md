# api-booking

A RESTful API for managing appointment bookings between clients and service providers, built with **Node.js**, **Express**, and **PostgreSQL**.

---

## Features

- JWT-based Authentication & Authorization
- User Roles: `user` (client) and `provider`
- Providers can create available time slots
- Clients can book viewappointment and cancel appointments
- Swagger API Documentation
- Integration testing with `node:test` and `supertest`

---

## Installation dependencies
- npm install

## Database setup
- createdb api_booking
- createdb api_booking_test

## running the app
- in development: npm run dev
- in production: npm start