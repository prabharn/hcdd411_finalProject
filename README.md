# BookLight – AI Study Dashboard

BookLight is a full-stack student productivity dashboard that combines a local AI study assistant with task management, calendar scheduling, and study tracking. The application uses a Node.js/Express backend, MongoDB for data storage, and Ollama for running a local AI model.

## Features

- AI-powered study chat using Ollama
- Task management system
- Calendar event tracking
- Pomodoro timer with study statistics
- Persistent storage using MongoDB

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- AI: Ollama

## Installation

1. Clone the repository

```
git clone https://github.com/your-repo/booklight.git
cd booklight
```

2. Install dependencies

```
npm install
```

## Environment Setup

The `.env` file is already included for this project.

No additional setup is required.

## Ollama Setup

1. Download and install Ollama:
https://ollama.com/download

2. Restart your terminal

3. Pull the model:

```
ollama pull llama3.2
```

4. Start Ollama (if not already running):

```
ollama serve
```

5. Optional test:

```
ollama run llama3.2
```

Type "hello" to confirm it responds.

## Running the Application

1. Make sure Ollama is running:

```
ollama serve
```

2. Start the server:

```
npm start
```

3. Open the app:

```
http://localhost:3000
```

## Startup Order

1. Start Ollama  
2. Run `npm start`  
3. Open the browser  

## Common Issues

### Ollama not working
- Run `ollama pull llama3.2`
- Run `ollama serve`

### Ollama not recognized
- Restart terminal or computer

## Team Setup

Each team member must:

1. Install Node.js  
2. Run `npm install`  
3. Install and run Ollama  

## Files

- `server.js` – backend entry point  
- `src/` – routes, controllers, services, models  
- `public/` – frontend files  

## Notes

- Ollama runs the AI locally (no API required)
- MongoDB stores sessions, tasks, events, and stats
