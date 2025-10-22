# Carbon Offset Tracker Backend

A Node.js backend service for tracking carbon emissions and purchasing tokenized carbon credits on the Hedera blockchain network.

## Features

- **User Authentication**: JWT-based authentication
- **Emission Logging**: Log carbon emissions to Hedera Consensus Service (HCS)
- **Carbon Credits**: Purchase and redeem tokenized carbon offset credits
- **Blockchain Integration**: Full Hedera integration for transparency and immutability
- **Real-time Calculations**: CO2e calculations with external API support
- **Marketplace**: Browse and purchase from various carbon offset projects

## Tech Stack

- **Backend**: Node.js, Express.js
- **Blockchain**: Hedera Hashgraph (Testnet)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet, CORS, Rate limiting, Input validation

## Prerequisites

- Node.js 16+ and npm
- MongoDB (local or cloud)
- Hedera Testnet account with HBAR balance


## Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd backend1
npm install
```

2. **Environment Setup**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.your-account-id
HEDERA_OPERATOR_PRIVATE_KEY=your-private-key

# Database
MONGO_URI=mongodb://localhost:27017/carbon-tracker

# Authentication
JWT_SECRET=your-jwt-secret

# Server
PORT=5000
```

3. **Database Setup**:
Ensure MongoDB is running locally or update `MONGO_URI` for cloud database.

4. **Blockchain Setup** (Run once):
```bash
npm run setup
```

This will:
- Create HCS topic for emission logging
- Create fungible token for carbon credits
- Add sample carbon offset projects
- Display topic and token IDs to add to `.env`

5. **Start the server**:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

- `GET /api/auth/profile` - Get user profile (protected)

### Emissions
- `POST /api/emissions/log` - Log carbon emission (protected)
- `GET /api/emissions/history` - Get emission history (protected)
- `GET /api/emissions/stats` - Get emission statistics (protected)
- `POST /api/emissions/calculate` - Calculate CO2e for activity (protected)
- `GET /api/emissions/categories` - Get supported emission categories

### Offsets
- `GET /api/offsets/marketplace` - Browse carbon offset projects
- `POST /api/offsets/purchase` - Purchase carbon credits (protected)
- `POST /api/offsets/redeem` - Redeem carbon credits (protected)
- `GET /api/offsets/balance` - Get token balances (protected)
- `GET /api/offsets/history` - Get offset purchase history (protected)

### Transactions
- `GET /api/transactions/logs` - Get transaction history (protected)
- `GET /api/transactions/dashboard` - Get dashboard statistics (protected)
- `GET /api/transactions/:id` - Get transaction details (protected)

## Example Usage

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Log Emission
```bash
curl -X POST http://localhost:5000/api/emissions/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "emissionType": "travel",
    "category": "car_gasoline",
    "amount": 150,
    "unit": "km",
    "description": "Daily commute"
  }'
```

### 3. Purchase Offset
```bash
curl -X POST http://localhost:5000/api/offsets/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userHederaAddress": "0.0.your-account",
    "projectId": "FOREST_001",
    "quantity": 1,
    "totalCo2eKg": 100,
    "totalHbarCost": 15
  }'
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
backend1/
├── src/
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, validation, error handling
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic (Hedera service)
│   ├── utils/          # Utilities (logger, CO2 calculator)
│   └── app.js          # Express app setup
├── tests/              # Test files
├── setup.js            # Blockchain setup script
└── package.json
```

## Blockchain Integration

### Hedera Consensus Service (HCS)
- All emissions are logged to an HCS topic for immutable record-keeping
- Each emission log includes user ID, emission details, and timestamp
- Transaction IDs are stored in MongoDB for verification

### Token Service
- Carbon offset credits are represented as fungible tokens
- 1 token = 1 kg CO2e offset
- Tokens are minted when purchased and burned when redeemed
- All token transactions are recorded on Hedera

### Crypto Service
- HBAR transfers for purchasing carbon credits
- Account balance queries for validation
- All transactions use server-side signing (operator account)

## Security Features

- **Input Validation**: Joi schemas for all API inputs
- **Rate Limiting**: Configurable rate limits per endpoint
- **Authentication**: JWT tokens with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds
- **CORS Protection**: Configurable origin restrictions
- **Security Headers**: Helmet.js for security headers
- **Error Handling**: Structured error responses without sensitive data

## Monitoring and Logging

- **Winston Logger**: Structured logging with different levels
- **Error Tracking**: Comprehensive error logging with stack traces
- **Transaction Logging**: All blockchain transactions logged
- **Health Check**: `/health` endpoint for monitoring

## Future Enhancements

### Client-Side Signing
The current implementation uses server-side signing for simplicity. For production:

1. **Modify Purchase Endpoint**: Return unsigned transactions instead of executing them
2. **Add Signature Verification**: Verify client signatures before submission
3. **Wallet Integration**: Support HashPack and other Hedera wallets
4. **Multi-Signature**: Support for complex signing scenarios

### Scalability Improvements
- **Redis Caching**: Cache frequent queries (balances, project data)
- **Database Indexing**: Optimize MongoDB queries
- **Load Balancing**: Support multiple server instances
- **Background Jobs**: Queue system for blockchain operations

## Troubleshooting

### Common Issues

1. **Hedera Connection Errors**:
   - Verify operator account has sufficient HBAR balance
   - Check network connectivity to Hedera Testnet
   - Validate private key format

2. **Database Connection**:
   - Ensure MongoDB is running
   - Check connection string format
   - Verify database permissions

3. **Token/Topic Not Found**:
   - Run `npm run setup` to create blockchain resources
   - Update `.env` with correct IDs
   - Verify operator account has admin keys

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review Hedera documentation: https://docs.hedera.com
- Open an issue in the repository