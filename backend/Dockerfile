# Используем официальный Node.js образ
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код проекта
COPY . .

# Собираем проект (TypeScript -> JavaScript)
RUN npm run build

# Экспонируем порт, который указан в .env
EXPOSE 3000

# Команда запуска приложения
CMD ["npm", "run", "start:prod"]
