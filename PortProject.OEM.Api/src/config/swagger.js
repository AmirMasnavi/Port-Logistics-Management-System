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
        CreateVveRequest: {
          type: 'object',
          required: ['vvnId', 'vesselIdentifier', 'actualArrivalTime'],
          properties: {
            vvnId: {
              type: 'string',
              description: 'Reference to VVN from Master Data',
              example: 'VVN-20241206-0001',
            },
            vesselIdentifier: {
              type: 'string',
              description: 'Vessel IMO number or identifier',
              example: 'IMO9876543',
            },
            actualArrivalTime: {
              type: 'string',
              format: 'date-time',
              description: 'Actual arrival time at the port',
              example: '2024-12-06T10:30:00Z',
            },
            notes: {
              type: 'string',
              description: 'Optional notes or comments',
              example: 'Vessel arrived on schedule',
            },
          },
        },
        UpdateVveRequest: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['In Progress', 'Completed', 'Cancelled'],
              description: 'Execution status',
              example: 'Completed',
            },
            actualDepartureTime: {
              type: 'string',
              format: 'date-time',
              description: 'Actual departure time',
              example: '2024-12-06T18:30:00Z',
            },
            notes: {
              type: 'string',
              description: 'Updated notes',
              example: 'All operations completed successfully',
            },
          },
        },
        VveResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'VVE created successfully',
            },
            data: {
              type: 'object',
              properties: {
                vveId: {
                  type: 'string',
                  example: 'VVE-20241206-0001',
                },
                vvnId: {
                  type: 'string',
                  example: 'VVN-20241206-0001',
                },
                vesselIdentifier: {
                  type: 'string',
                  example: 'IMO9876543',
                },
                actualArrivalTime: {
                  type: 'string',
                  format: 'date-time',
                },
                creatorUserId: {
                  type: 'string',
                  example: 'user@example.com',
                },
                status: {
                  type: 'string',
                  enum: ['In Progress', 'Completed', 'Cancelled'],
                  example: 'In Progress',
                },
                actualDepartureTime: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                notes: {
                  type: 'string',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
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
