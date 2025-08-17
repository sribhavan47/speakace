# SpeakAce Backend

A comprehensive Node.js/Express backend for the AI-powered public speaking training platform.

## Features

- **AI-Powered Speech Analysis**: Real-time speech quality assessment using OpenAI
- **Dynamic Prompt Generation**: AI-generated prompts and distractor words for games
- **Personalized Feedback**: AI coaching and improvement suggestions
- **Real-time Communication**: Socket.IO integration for live game sessions
- **Comprehensive Analytics**: Progress tracking and performance insights
- **User Management**: Authentication, profiles, and achievement system
- **Game Session Management**: Complete game lifecycle tracking

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Services**: OpenAI API integration
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, rate limiting

## Prerequisites

- Node.js 18+ 
- MongoDB 6+
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd speak-ace/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/speak-ace
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas
   # Update MONGODB_URI in .env
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Games
- `POST /api/games/start-session` - Start a new game session
- `POST /api/games/end-session/:sessionId` - End game session with AI analysis
- `GET /api/games/sessions` - Get user's game sessions
- `GET /api/games/sessions/:sessionId` - Get specific game session
- `GET /api/games/prompts/:gameType` - Get AI-generated prompts
- `POST /api/games/analyze-speech` - Real-time speech analysis

### Analysis
- `POST /api/analysis/speech-quality` - Comprehensive speech analysis
- `POST /api/analysis/rapid-fire` - Rapid-fire response analysis
- `POST /api/analysis/energy-transition` - Energy level transition analysis
- `POST /api/analysis/word-integration` - Word integration analysis
- `POST /api/analysis/coherence` - Speech coherence analysis
- `POST /api/analysis/feedback` - Generate personalized feedback
- `GET /api/analysis/exercises/:type` - Get improvement exercises

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/sessions` - Get user sessions
- `GET /api/users/achievements` - Get user achievements
- `GET /api/users/leaderboard` - Get game leaderboard
- `POST /api/users/feedback-request` - Request personalized feedback
- `GET /api/users/progress-report` - Get progress report
- `GET /api/users/motivation` - Get motivational message

### Progress
- `GET /api/progress/overview` - Get progress overview
- `GET /api/progress/analytics` - Get detailed analytics
- `GET /api/progress/insights` - Get AI-generated insights
- `GET /api/progress/compare` - Compare progress across periods

## AI Services

### Speech Analysis Service
- Real-time speech quality assessment
- Game-specific analysis (Rapid Fire, Conductor, Triple Step)
- Comprehensive feedback generation

### Prompt Generation Service
- Dynamic analogy prompts for Rapid Fire
- Engaging topics for Conductor
- Random words for Triple Step
- Difficulty-based customization

### Feedback Service
- Personalized coaching advice
- Game-specific improvement suggestions
- Progress reports and motivation

### Energy Detection Service
- Voice energy level analysis
- Energy transition evaluation
- Breathing cue response analysis

### Coherence Analysis Service
- Speech coherence assessment
- Topic adherence monitoring
- Word integration analysis

## Database Models

### User Model
- Authentication and profile information
- Game preferences and settings
- Statistics and achievements
- Progress tracking

### GameSession Model
- Complete game session data
- Performance metrics
- AI analysis results
- Game-specific data storage

## Real-time Features

### Socket.IO Integration
- Live game session management
- Real-time performance updates
- Multiplayer game support (future)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation and sanitization

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── middleware/      # Authentication and error handling
│   ├── models/          # Database models
│   ├── routes/          # API route handlers
│   ├── services/        # AI services and business logic
│   ├── utils/           # Utility functions and logging
│   └── server.js        # Main application entry point
├── logs/                # Application logs
├── uploads/             # File uploads (future)
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (future)

### Logging
- Console logging for development
- File logging for production
- Error tracking and monitoring
- Request/response logging

## Testing

### API Testing
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'
```

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure CORS origins
5. Set up logging and monitoring
6. Use PM2 or similar process manager

### Environment Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed CORS origins

## Monitoring and Maintenance

### Health Checks
- `/health` endpoint for monitoring
- Database connection status
- AI service connectivity

### Logging
- Structured logging with Winston
- Error tracking and alerting
- Performance monitoring

### Backup
- Regular database backups
- Log file rotation
- Configuration backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## Roadmap

- [ ] WebSocket-based real-time game sessions
- [ ] Advanced AI analysis features
- [ ] Multiplayer game support
- [ ] Video recording and analysis
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Integration with external platforms
