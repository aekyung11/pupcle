FROM docker.io/bitnami/discourse:3

RUN apt-get -y update; apt-get -y install curl && curl -L https://github.com/DarthSim/hivemind/releases/download/v1.0.6/hivemind-v1.0.6-linux-amd64.gz -o hivemind.gz \
  && gunzip hivemind.gz \
  && mv hivemind /usr/local/bin

COPY Procfile Procfile
RUN chmod +x /usr/local/bin/hivemind

ENTRYPOINT []
CMD ["/usr/local/bin/hivemind"]
