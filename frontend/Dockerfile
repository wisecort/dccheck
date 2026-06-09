FROM registry.access.redhat.com/ubi9/nodejs-22 AS builder

WORKDIR /opt/app-root/src

COPY . .

RUN npm install
RUN npm run build

FROM registry.access.redhat.com/ubi9/nginx-126

USER 0

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

RUN cat > /opt/app-root/etc/nginx.default.d/default.conf <<'EOF'
location /api/ {
    proxy_pass http://backend:8000/;
}

location / {
    try_files $uri $uri/ /index.html;
}
EOF

RUN chown -R 1001:0 /opt/app-root/src /opt/app-root/etc/nginx.default.d

USER 1001

CMD ["/usr/libexec/s2i/run"]
