FROM registry.access.redhat.com/ubi9/nodejs-22 AS builder

USER 0
ADD . /tmp/src
RUN chown -R 1001:0 /tmp/src
USER 1001

RUN /usr/libexec/s2i/assemble

FROM registry.access.redhat.com/ubi9/nginx-126

USER 0
COPY --from=builder /opt/app-root/src/dist /tmp/src
COPY nginx.conf /tmp/src/nginx-default-cfg
RUN chown -R 1001:0 /tmp/src

USER 1001
RUN /usr/libexec/s2i/assemble

CMD ["/usr/libexec/s2i/run"]
