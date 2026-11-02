FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview
WORKDIR /app
COPY app_publish/ .

ENV ASPNETCORE_URLS=http://+:5107
EXPOSE 5107

ENTRYPOINT ["dotnet", "Daycare.Api.dll"]
