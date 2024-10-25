# Используем базовый образ Node.js
FROM node:20

# Добавляем вручную репозитории, используя ftp.debian.org
RUN echo "deb http://ftp.debian.org/debian bullseye main" > /etc/apt/sources.list \
	&& echo "deb http://security.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list

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
