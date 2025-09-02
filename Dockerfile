# Use Node.js LTS (good for Angular projects)
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package files first (better caching for deps)
COPY package*.json ./

# Install dependencies
RUN npm install -g @angular/cli && npm install

# Copy the rest of the project
COPY . .

# Expose Angular default port
EXPOSE 4200

# Run Angular dev server
CMD ["ng", "serve", "--host", "0.0.0.0"]
