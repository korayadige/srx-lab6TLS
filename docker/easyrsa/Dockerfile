FROM alpine:3.14

RUN apk update && apk add curl openssl
WORKDIR /tmp
RUN curl -sSfL https://github.com/OpenVPN/easy-rsa/releases/download/v3.2.2/EasyRSA-3.2.2.tgz | tar xz
RUN mv EasyRSA-3.2.2 /opt
RUN ln -s /opt/EasyRSA-3.2.2/easyrsa /usr/local/bin
RUN adduser -D operator
USER operator
WORKDIR /home/operator
CMD ["tail", "f", "/dev/null"]