const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Carbon Offset Tracker API',
    version: '1.0.0',
    description: 'API for tracking carbon emissions and purchasing tokenized carbon credits on Hedera blockchain',
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' ? 'https://carbon-offset-backend.onrender.com' : 'http://localhost:5000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'API Overview',
        tags: ['General'],
        responses: {
          200: {
            description: 'API information and available endpoints',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    version: { type: 'string' },
                    endpoints: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Health Check',
        tags: ['General'],
        responses: {
          200: {
            description: 'Service health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    uptime: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/offsets/marketplace': {
      get: {
        summary: 'Browse carbon offset projects',
        tags: ['Offsets'],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 }
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 20 }
          }
        ],
        responses: {
          200: {
            description: 'Projects retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        projects: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Project' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/profile': {
      get: {
        summary: 'Get user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/emissions/log': {
      post: {
        summary: 'Log carbon emission',
        tags: ['Emissions'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['emissionType', 'category', 'amount', 'unit'],
                properties: {
                  emissionType: { type: 'string', enum: ['travel', 'energy', 'food', 'other'] },
                  category: { type: 'string' },
                  amount: { type: 'number', minimum: 0 },
                  unit: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Emission logged successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        emission: { $ref: '#/components/schemas/Emission' },
                        blockchain: {
                          type: 'object',
                          properties: {
                            transactionId: { type: 'string' },
                            consensusTimestamp: { type: 'string' },
                            topicId: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/emissions/history': {
      get: {
        summary: 'Get emission history',
        tags: ['Emissions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'emissionType', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Emission history retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        emissions: { type: 'array', items: { $ref: '#/components/schemas/Emission' } },
                        pagination: { type: 'object' },
                        summary: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/offsets/purchase': {
      post: {
        summary: 'Purchase carbon credits',
        tags: ['Offsets'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userHederaAddress', 'projectId', 'quantity', 'totalCo2eKg', 'totalHbarCost'],
                properties: {
                  userHederaAddress: { type: 'string', pattern: '^0\\.0\\.\\d+$' },
                  projectId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                  totalCo2eKg: { type: 'number', minimum: 0 },
                  totalHbarCost: { type: 'number', minimum: 0 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Offset purchased successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        offset: { type: 'object' },
                        blockchain: {
                          type: 'object',
                          properties: {
                            hbarTransactionId: { type: 'string' },
                            tokenMintTransactionId: { type: 'string' },
                            tokenId: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/offsets/balance': {
      get: {
        summary: 'Get user token balances',
        tags: ['Offsets'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token balances retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        accountId: { type: 'string' },
                        hbarBalance: { type: 'string' },
                        tokenBalances: { type: 'object' },
                        carbonOffsetTokens: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/emissions/categories': {
      get: {
        summary: 'Get supported emission categories',
        tags: ['Emissions'],
        responses: {
          200: {
            description: 'Emission categories retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/transactions/dashboard': {
      get: {
        summary: 'Get dashboard statistics',
        tags: ['Transactions'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard stats retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalEmissions: { type: 'number' },
                            totalOffsets: { type: 'number' },
                            netEmissions: { type: 'number' },
                            offsetPercentage: { type: 'number' }
                          }
                        },
                        recentActivity: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
                properties: {
                  userHederaAddress: { type: 'string', pattern: '^0\\.0\\.\\d+$' },
                  projectId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                  totalCo2eKg: { type: 'number', minimum: 0 },
                  totalHbarCost: { type: 'number', minimum: 0 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Offset purchased successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        offset: { type: 'object' },
                        blockchain: {
                          type: 'object',
                          properties: {
                            hbarTransactionId: { type: 'string' },
                            tokenMintTransactionId: { type: 'string' },
                            tokenId: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/transactions/dashboard': {
      get: {
        summary: 'Get dashboard statistics',
        tags: ['Transactions'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard stats retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        summary: { type: 'object' },
                        recentActivity: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            hederaAccountId: { type: 'string', pattern: '^0\\.0\\.\\d+$' },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                avatar: { type: 'string' }
              }
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Emission: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            emissionType: { type: 'string', enum: ['travel', 'energy', 'food', 'other'] },
            category: { type: 'string' },
            amount: { type: 'number', minimum: 0 },
            unit: { type: 'string' },
            co2eKg: { type: 'number', minimum: 0 },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string' },
            hederaTransactionId: { type: 'string' },
            consensusTimestamp: { type: 'string' },
            topicId: { type: 'string' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            projectType: { type: 'string', enum: ['reforestation', 'renewable_energy', 'methane_capture', 'direct_air_capture', 'other'] },
            costPerKg: { type: 'number', minimum: 0 },
            availableCredits: { type: 'number', minimum: 0 },
            verificationStandard: { type: 'string', enum: ['VCS', 'CDM', 'Gold_Standard', 'CAR', 'other'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        }
      }
    }
};

module.exports = swaggerSpec;