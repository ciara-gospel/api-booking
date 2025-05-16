// swaggerConfig.js

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * @swagger
 * tags:
 *   - name: Appointment
 *     description: manages appointment
 *   - name: TimeSlot
 *     description: Creation and management of slots
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Booking',
      version: '1.0.0',
      description: 'Documentation de l’API de réservation',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur local de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'], // Adapte les chemins à ton projet
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
