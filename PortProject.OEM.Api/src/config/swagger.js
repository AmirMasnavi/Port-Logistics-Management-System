import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OEM API - Operations & Execution Management',
      version: '1.0.0',
      description: `
        **Operations & Execution Management Module**
        
        This is an independent back-end service designed with modular, decentralized architecture.
        
        **Key Features:**
        - REST-based API with CRUD operations
        - Inter-module communication via REST API calls
        - Firebase Authentication (IAM-based)
        - RBAC and ABAC authorization support
        - No direct database access between modules
        
        **Authentication:**
        - Use Firebase JWT token in Authorization header: \`Bearer <token>\`
      `,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5274',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase JWT token',
        },
      },
      schemas: {
        VvnDto: {
          type: 'object',
          properties: {
            businessId: {
              type: 'string',
              example: 'VVN001',
            },
            vesselImo: {
              type: 'string',
              example: 'IMO1234567',
            },
            estimatedArrival: {
              type: 'string',
              format: 'date-time',
            },
            estimatedDeparture: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              example: 'Pending',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/*.js', './src/routes/*.js', './src/server.js'], // Path to API docs
};

export const swaggerSpec = swaggerJsdoc(options);

