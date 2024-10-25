# Используем базовый образ Node.js
FROM node:20

# Удаление старых источников и добавление новых
RUN echo "deb http://ftp.us.debian.org/debian bookworm main" > /etc/apt/sources.list \
	&& echo "deb http://ftp.us.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list

# Установка PostgreSQL клиента
RUN apt-get update && apt-get install -y postgresql-client

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
