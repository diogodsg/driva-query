# build environment
FROM node:20-alpine AS build
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN npm cache clean --force
RUN npm install --force
COPY . /app
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /home/www/static

RUN rm -rf /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/conf.d
EXPOSE 80