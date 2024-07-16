# ============================
# Prepare Build Environment
FROM hub.aiursoft.cn/node AS npm-env
WORKDIR /src
COPY . .
RUN npm install
RUN npm run build

# ============================
# Prepare Runtime Environment
FROM hub.aiursoft.cn/aiursoft/static
COPY --from=npm-env /src/dist /data
