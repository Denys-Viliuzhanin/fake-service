FROM node

RUN mkdir /app && mkdir /app/fake-service && mkdir /data && mkdir /data/fake-service

RUN useradd -ms /bin/bash app


COPY . /app/fake-service
COPY package.json /app/fake-service

RUN chmod +x /app/fake-service/bin
RUN chown app /data/fake-service 
RUN chmod +rw /data/fake-service 
WORKDIR /app/fake-service

USER app

ENTRYPOINT ["./bin/fake-service.sh"]