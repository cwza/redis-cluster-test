FROM node:latest
USER root
RUN mkdir -p /app
WORKDIR /app
# COPY ./* /app/
# RUN npm install
ENTRYPOINT ["npm", "start"]