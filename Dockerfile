FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend ./backend
COPY data ./default-data
COPY backend/scripts/bootstrap-data.sh /usr/local/bin/bootstrap-data.sh
RUN chmod +x /usr/local/bin/bootstrap-data.sh

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>{if(!r.ok) process.exit(1)}).catch(()=>process.exit(1))"

CMD ["/bin/sh", "-c", "/usr/local/bin/bootstrap-data.sh && npm start"]
