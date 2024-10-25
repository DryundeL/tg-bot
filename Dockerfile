# Используем базовый образ Node.js
FROM node:20

# Установка PostgreSQL клиента без обновления
RUN apt-get install -y --no-install-recommends postgresql-client

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальную часть кода приложения
COPY . .

# Собираем TypeScript код
RUN npm run build

# Указываем порт, который будет слушать контейнер
EXPOSE 3000

# Команда для запуска приложения
CMD ["npm", "run", "start"]
