# Stock Market Learning Application

A comprehensive platform for learning stock market trading through interactive courses, virtual trading, and gamification.

## Features

- User Management with role-based access control
- Interactive Courses with multimedia content
- Virtual Trading with real-time market data
- Gamification with badges and leaderboards
- Community Forums and Discussions
- Real-time notifications using WebSocket
- Payment Integration for premium features
- Advanced Analytics and Progress Tracking

## Tech Stack

- **Frontend**: React.js, Redux, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Authentication**: JWT, Passport.js
- **API Documentation**: Swagger
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **Payment**: Stripe
- **Cloud Storage**: AWS S3

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis (optional, for caching)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stock-market-learning-app.git
   cd stock-market-learning-app
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Start the development servers:

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm start
   ```

## Project Structure

```
stock-market-learning-app/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── config/
│   ├── public/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── services/
│   │   └── utils/
│   └── public/
└── docs/
```

## API Documentation

API documentation is available at `http://localhost:5000/api-docs` when running the development server.

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Set up production environment variables

3. Deploy to your preferred hosting service (AWS, Heroku, DigitalOcean, etc.)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@stockmarketlearning.com or join our Slack channel.
