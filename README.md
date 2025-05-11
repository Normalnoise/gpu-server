# GPU Server Management System

A React-based web management interface for GPU server management, featuring team collaboration and resource management capabilities.

## Features

- Team Management
  - Create and manage teams
  - Invite team members
  - Role-based access control (Owner, Admin, Member)
  - Team member management

## Tech Stack

- Frontend Framework: React
- UI Library: Ant Design
- Build Tool: Vite
- Language: TypeScript

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gpu-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── pages/          # Page components
  ├── theme/          # Theme configuration
  ├── App.tsx         # Root component
  └── main.tsx        # Entry point
```

## Development

- The project uses TypeScript for type safety
- Ant Design components for UI
- Dark theme by default

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request