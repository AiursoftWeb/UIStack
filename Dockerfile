ARG CSPROJ_PATH="./src/Aiursoft.UiStack.Demo/"
ARG PROJ_NAME="Aiursoft.UiStack.Demo"

# ============================
# Prepare NPM Environment
FROM hub.aiursoft.cn/node:21-alpine AS npm-env
ARG CSPROJ_PATH
WORKDIR /src
COPY . .

# NPM Build at PGK_JSON_PATH
RUN npm install --prefix "${CSPROJ_PATH}wwwroot" --loglevel verbose

# ============================
# Prepare Building Environment
FROM hub.aiursoft.cn/aiursoft/internalimages/dotnet AS build-env
ARG CSPROJ_PATH
ARG PROJ_NAME
WORKDIR /src
COPY --from=npm-env /src .

# Build
RUN dotnet publish ${CSPROJ_PATH}${PROJ_NAME}.csproj  --configuration Release --no-self-contained --runtime linux-x64 --output /app
RUN cp -r ${CSPROJ_PATH}/wwwroot/* /app/wwwroot

# ============================
# Prepare Runtime Environment
FROM hub.aiursoft.cn/aiursoft/internalimages/dotnet
ARG PROJ_NAME
WORKDIR /app
COPY --from=build-env /app .

# Edit appsettings.json
RUN sed -i 's/DataSource=app.db/DataSource=\/data\/app.db/g' appsettings.json
RUN sed -i 's/\/tmp\/data/\/data/g' appsettings.json
RUN mkdir -p /data

VOLUME /data
EXPOSE 5000

ENV SRC_SETTINGS=/app/appsettings.json
ENV VOL_SETTINGS=/data/appsettings.json
ENV DLL_NAME=${PROJ_NAME}.dll

#ENTRYPOINT dotnet $DLL_NAME --urls http://*:5000
ENTRYPOINT ["/bin/bash", "-c", "\
    if [ ! -f \"$VOL_SETTINGS\" ]; then \
        cp $SRC_SETTINGS $VOL_SETTINGS; \
    fi && \
    if [ -f \"$SRC_SETTINGS\" ]; then \
        rm $SRC_SETTINGS; \
    fi && \
    ln -s $VOL_SETTINGS $SRC_SETTINGS && \
    dotnet $DLL_NAME --urls http://*:5000 \
"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=180s --retries=3 CMD \
wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1