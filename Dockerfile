FROM node:17

ENV PORT 80

WORKDIR /opt/only-miraidai-fun

EXPOSE $PORT

COPY . /opt/only-miraidai-fun

RUN npm ci

CMD [ "npm", "start" ]
